const { Schema, default: mongoose } = require("mongoose")
const Product = require("../models/Product")

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
