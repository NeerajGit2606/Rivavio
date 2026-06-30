const { Schema, default: mongoose } = require("mongoose")
const { parse } = require("csv-parse/sync")
const Product = require("../models/Product")
const Category = require("../models/Category")
const Brand = require("../models/Brand")

exports.create = async (req, res) => {
    try {
        const created = new Product(req.body)
        await created.save()
        res.status(201).json(created)
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error adding product, please trying again later' })
    }
}

exports.getAll = async (req, res) => {
    try {
        const filter = {}
        const sort = {}
        let skip = 0
        let limit = 0

        // ── Brand filter ──────────────────────────────────────────────────
        if (req.query.brand) {
            filter.brand = { $in: req.query.brand }
        }

        // ── Category filter ───────────────────────────────────────────────
        if (req.query.category) {
            filter.category = { $in: req.query.category }
        }

        // ── Soft-delete for user-facing requests ──────────────────────────
        if (req.query.user) {
            filter['isDeleted'] = false
        }

        // ── Search: wrap in $and so it plays nicely with isDeleted/brand ──
        // BUG FIX: $or directly on filter conflicts with other conditions.
        // Wrapping everything in $and ensures all conditions apply together.
        if (req.query.search && req.query.search.trim() !== '') {
            const searchRegex = new RegExp(req.query.search.trim(), 'i')
            filter['$and'] = filter['$and'] || []
            filter['$and'].push({
                $or: [
                    { title: { $regex: searchRegex } },
                    { description: { $regex: searchRegex } }
                ]
            })
        }

        // ── Price range filter ────────────────────────────────────────────
        // BUG FIX: check !== undefined instead of truthy — priceMin=0 is falsy!
        if (req.query.priceMin !== undefined || req.query.priceMax !== undefined) {
            filter.price = {}
            if (req.query.priceMin !== undefined && req.query.priceMin !== '')
                filter.price['$gte'] = Number(req.query.priceMin)
            if (req.query.priceMax !== undefined && req.query.priceMax !== '')
                filter.price['$lte'] = Number(req.query.priceMax)
        }

        // ── Sort ──────────────────────────────────────────────────────────
        if (req.query.sort) {
            sort[req.query.sort] = req.query.order ? req.query.order === 'asc' ? 1 : -1 : 1
        }

        // ── Pagination ────────────────────────────────────────────────────
        if (req.query.page && req.query.limit) {
            const pageSize = req.query.limit
            const page = req.query.page
            skip = pageSize * (page - 1)
            limit = pageSize
        }

        const totalDocs = await Product.find(filter).sort(sort).populate("brand").countDocuments().exec()
        const results = await Product.find(filter).sort(sort).populate("brand").skip(skip).limit(limit).exec()

        res.set("X-Total-Count", totalDocs)
        res.status(200).json(results)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching products, please try again later' })
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params
        const result = await Product.findById(id).populate("brand").populate("category")
        res.status(200).json(result)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error getting product details, please try again later' })
    }
}

exports.updateById = async (req, res) => {
    try {
        const { id } = req.params
        const updated = await Product.findByIdAndUpdate(id, req.body, { new: true })
        res.status(200).json(updated)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating product, please try again later' })
    }
}

exports.undeleteById = async (req, res) => {
    try {
        const { id } = req.params
        const unDeleted = await Product.findByIdAndUpdate(id, { isDeleted: false }, { new: true }).populate('brand')
        res.status(200).json(unDeleted)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error restoring product, please try again later' })
    }
}

exports.deleteById = async (req, res) => {
    try {
        const { id } = req.params
        const deleted = await Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).populate("brand")
        res.status(200).json(deleted)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error deleting product, please try again later' })
    }
}

// Expected CSV columns: title,description,price,discountPercentage,category,brand,stockQuantity,thumbnail,images
// category/brand are matched by name (case-insensitive); images is a "|" separated list of URLs
exports.bulkUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No CSV file uploaded' })
        }

        const records = parse(req.file.buffer.toString('utf-8'), {
            columns: true,
            skip_empty_lines: true,
            trim: true
        })

        if (!records.length) {
            return res.status(400).json({ message: 'CSV file is empty' })
        }

        const categories = await Category.find({})
        const brands = await Brand.find({})
        const categoryMap = new Map(categories.filter(c => c.name).map(c => [c.name.toLowerCase(), c._id]))
        const brandMap = new Map(brands.filter(b => b.name).map(b => [b.name.toLowerCase(), b._id]))

        const errors = []
        const toInsert = []

        records.forEach((row, index) => {
            const rowNum = index + 2 // account for header row
            const categoryId = categoryMap.get((row.category || '').toLowerCase())
            const brandId = brandMap.get((row.brand || '').toLowerCase())

            if (!row.title || !row.description || !row.price || !row.stockQuantity || !row.thumbnail) {
                errors.push(`Row ${rowNum}: missing required field(s)`)
                return
            }
            if (!categoryId) {
                errors.push(`Row ${rowNum}: unknown category "${row.category}"`)
                return
            }
            if (!brandId) {
                errors.push(`Row ${rowNum}: unknown brand "${row.brand}"`)
                return
            }

            toInsert.push({
                title: row.title,
                description: row.description,
                price: Number(row.price),
                discountPercentage: Number(row.discountPercentage) || 0,
                category: categoryId,
                brand: brandId,
                stockQuantity: Number(row.stockQuantity),
                thumbnail: row.thumbnail,
                images: row.images ? row.images.split('|').map(s => s.trim()).filter(Boolean) : [row.thumbnail]
            })
        })

        if (toInsert.length) {
            await Product.insertMany(toInsert)
        }

        res.status(201).json({
            inserted: toInsert.length,
            failed: errors.length,
            errors
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error processing bulk upload, please check the CSV format and try again' })
    }
}

exports.getRecommendations = async (req, res) => {
    try {
        const { id } = req.params
        const product = await Product.findById(id)

        if (!product) {
            return res.status(404).json({ message: 'Product not found' })
        }

        const recommendations = await Product.find({
            _id: { $ne: id },
            category: product.category,
            isDeleted: false
        }).populate("brand").limit(8)

        res.status(200).json(recommendations)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching recommendations, please try again later' })
    }
}
