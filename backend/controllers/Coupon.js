const Coupon = require("../models/Coupon")

exports.create = async (req, res) => {
    try {
        const created = new Coupon(req.body)
        await created.save()
        res.status(201).json(created)
    } catch (error) {
        console.log(error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A coupon with this code already exists' })
        }
        res.status(500).json({ message: 'Error creating coupon, please try again later' })
    }
}

exports.getAll = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 })
        res.status(200).json(coupons)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching coupons, please try again later' })
    }
}

exports.deleteById = async (req, res) => {
    try {
        const { id } = req.params
        await Coupon.findByIdAndDelete(id)
        res.sendStatus(204)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error deleting coupon, please try again later' })
    }
}

exports.validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body

        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' })
        }

        const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true })

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' })
        }

        if (coupon.expiresAt < new Date()) {
            return res.status(400).json({ message: 'This coupon has expired' })
        }

        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'This coupon has reached its usage limit' })
        }

        if (cartTotal < coupon.minOrderValue) {
            return res.status(400).json({ message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon` })
        }

        let discountAmount = coupon.discountType === 'percentage'
            ? (cartTotal * coupon.discountValue) / 100
            : coupon.discountValue

        if (coupon.maxDiscountAmount !== null) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount)
        }

        discountAmount = Math.min(discountAmount, cartTotal)

        res.status(200).json({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: Math.round(discountAmount * 100) / 100
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error validating coupon, please try again later' })
    }
}
