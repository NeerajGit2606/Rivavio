const mongoose = require("mongoose")
const { Schema } = mongoose

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    item: {
        type: [Schema.Types.Mixed],
        required: true
    },
    address: {
        type: [Schema.Types.Mixed],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Dispatched', 'Out for delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentMode: {
        type: String,
        enum: ['COD', 'UPI', 'CARD'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'failed'],
        default: 'unpaid'
    },
    stripePaymentIntentId: {   // Razorpay payment ID bhi isme store hoga
        type: String,
        default: null
    },
    total: {
        type: Number,
        required: true
    },
    couponCode: {
        type: String,
        default: null
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    walletAmountUsed: {
        type: Number,
        default: 0
    },
    loyaltyPointsEarned: {
        type: Number,
        default: 0
    },
    statusHistory: {
        type: [{
            status: { type: String },
            note: { type: String },
            updatedAt: { type: Date, default: Date.now }
        }],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, { versionKey: false })

module.exports = mongoose.model("Order", orderSchema)
