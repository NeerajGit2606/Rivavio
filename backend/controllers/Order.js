const Order = require("../models/Order");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const { sendMail } = require("../utils/Emails");

const LOYALTY_POINTS_PER_RUPEE = 0.01 // 1 point per ₹100 spent

const statusEmailCopy = {
    'Pending': { subject: 'Order Received', line: 'We have received your order and it is being processed.' },
    'Dispatched': { subject: 'Order Dispatched', line: 'Your order has been dispatched and is on its way.' },
    'Out for delivery': { subject: 'Out for Delivery', line: 'Your order is out for delivery and should arrive soon.' },
    'Delivered': { subject: 'Order Delivered', line: 'Your order has been delivered. We hope you love it!' },
    'Cancelled': { subject: 'Order Cancelled', line: 'Your order has been cancelled.' },
}

const sendOrderStatusEmail = async (order, status) => {
    try {
        const user = await User.findById(order.user)
        if (!user?.email) return
        const copy = statusEmailCopy[status] || { subject: 'Order Update', line: `Your order status is now: ${status}.` }
        await sendMail(
            user.email,
            `${copy.subject} - Order #${order._id}`,
            `<p>Hi ${user.name},</p><p>${copy.line}</p><p><b>Order ID:</b> ${order._id}<br/><b>Total:</b> ₹${order.total}</p><p>Thank you for shopping with us.</p>`
        )
    } catch (error) {
        console.log('Order status email failed:', error.message);
    }
}

exports.create = async (req, res) => {
    try {
        const body = { ...req.body }

        // ── Coupon: re-validate server-side, never trust client-sent discount ──
        if (body.couponCode) {
            const coupon = await Coupon.findOne({ code: body.couponCode.trim().toUpperCase(), isActive: true })
            if (coupon && coupon.expiresAt >= new Date() && (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit) && body.total >= coupon.minOrderValue) {
                let discount = coupon.discountType === 'percentage' ? (body.total * coupon.discountValue) / 100 : coupon.discountValue
                if (coupon.maxDiscountAmount !== null) discount = Math.min(discount, coupon.maxDiscountAmount)
                discount = Math.min(discount, body.total)
                body.discountAmount = Math.round(discount * 100) / 100
                body.total = Math.max(0, body.total - body.discountAmount)
                await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } })
            } else {
                delete body.couponCode
                body.discountAmount = 0
            }
        }

        // ── Wallet: never let it exceed the user's actual balance or the order total ──
        if (body.walletAmountUsed > 0) {
            const user = await User.findById(body.user)
            const usable = Math.min(body.walletAmountUsed, user?.walletBalance || 0, body.total)
            body.walletAmountUsed = Math.max(0, Math.round(usable * 100) / 100)
            body.total = Math.max(0, body.total - body.walletAmountUsed)
            if (body.walletAmountUsed > 0) {
                await User.findByIdAndUpdate(body.user, { $inc: { walletBalance: -body.walletAmountUsed } })
            }
        }

        body.loyaltyPointsEarned = Math.round(body.total * LOYALTY_POINTS_PER_RUPEE)
        body.statusHistory = [{ status: 'Pending', note: 'Order placed', updatedAt: new Date() }]

        const created = new Order(body)
        await created.save()

        if (created.loyaltyPointsEarned > 0) {
            await User.findByIdAndUpdate(created.user, { $inc: { loyaltyPoints: created.loyaltyPointsEarned } })
        }

        sendOrderStatusEmail(created, 'Pending')

        res.status(201).json(created)
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error creating an order, please trying again later' })
    }
}

exports.getByUserId = async (req, res) => {
    try {
        const { id } = req.params
        const results = await Order.find({ user: id })
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error fetching orders, please trying again later' })
    }
}

exports.getAll = async (req, res) => {
    try {
        let skip = 0
        let limit = 0

        if (req.query.page && req.query.limit) {
            const pageSize = req.query.limit
            const page = req.query.page
            skip = pageSize * (page - 1)
            limit = pageSize
        }

        const totalDocs = await Order.find({}).countDocuments().exec()
        const results = await Order.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).exec()

        res.header("X-Total-Count", totalDocs)
        res.status(200).json(results)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching orders, please try again later' })
    }
};

exports.updateById = async (req, res) => {
    try {
        const { id } = req.params
        const existing = await Order.findById(id)
        if (!existing) {
            return res.status(404).json({ message: 'Order not found' })
        }

        const statusChanged = req.body.status && req.body.status !== existing.status
        const update = { ...req.body }

        if (statusChanged) {
            update.$push = { statusHistory: { status: req.body.status, note: req.body.note || '', updatedAt: new Date() } }

            // ── Cancellation: reverse the wallet debit and the loyalty points earned ──
            if (req.body.status === 'Cancelled' && existing.status !== 'Cancelled') {
                if (existing.walletAmountUsed > 0) {
                    await User.findByIdAndUpdate(existing.user, { $inc: { walletBalance: existing.walletAmountUsed } })
                }
                if (existing.loyaltyPointsEarned > 0) {
                    await User.findByIdAndUpdate(existing.user, { $inc: { loyaltyPoints: -existing.loyaltyPointsEarned } })
                }
            }
        }

        const updated = await Order.findByIdAndUpdate(id, update, { new: true })

        if (statusChanged) {
            sendOrderStatusEmail(updated, req.body.status)
        }

        res.status(200).json(updated)
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating order, please try again later' })
    }
}

exports.getAnalytics = async (req, res) => {
    try {
        const since = new Date()
        since.setDate(since.getDate() - 30)

        const [revenueAgg, statusBreakdown, salesByDay, topProducts, totalOrders] = await Promise.all([
            Order.aggregate([
                { $match: { status: { $ne: 'Cancelled' } } },
                { $group: { _id: null, revenue: { $sum: '$total' } } }
            ]),
            Order.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: since }, status: { $ne: 'Cancelled' } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            // Order.item stores the raw (already-populated) cart item objects, so the
            // product title is embedded directly — no need to look the product back up.
            Order.aggregate([
                { $match: { status: { $ne: 'Cancelled' } } },
                { $unwind: '$item' },
                { $group: { _id: '$item.product._id', title: { $first: '$item.product.title' }, quantity: { $sum: '$item.quantity' } } },
                { $sort: { quantity: -1 } },
                { $limit: 5 }
            ]),
            Order.countDocuments()
        ])

        res.status(200).json({
            totalRevenue: revenueAgg[0]?.revenue || 0,
            totalOrders,
            statusBreakdown,
            salesByDay,
            topProducts
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching analytics, please try again later' })
    }
}
