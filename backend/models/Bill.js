const mongoose = require("mongoose")
const { Schema } = mongoose

const billSchema = new Schema({
    businessId: {
        type: Schema.Types.ObjectId,
        ref: "Business",
        required: true
    },
    billNumber: {
        type: Number,
        required: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true
    },
    billDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    // frozen snapshot of what was fed into calculateJewelryPrice -- never re-derive
    // from "current" business defaults, a historical bill must never silently change
    pricingInputs: {
        grossWeightGrams: { type: Number, required: true },
        ratePerGram: { type: Number, required: true },
        wastagePercent: { type: Number, default: 0 },
        makingChargeType: { type: String, enum: ["percentage", "flat"], required: true },
        makingChargeValue: { type: Number, required: true },
        makingChargeBasis: { type: String, enum: ["perGram", "total"], default: "total" },
        gstPercent: { type: Number, default: 3 }
    },
    // flattened 1:1 output of calculateJewelryPrice
    effectiveWeightGrams: { type: Number, required: true },
    metalValuePaise: { type: Number, required: true },
    makingChargePaise: { type: Number, required: true },
    subtotalPaise: { type: Number, required: true },
    gstPaise: { type: Number, required: true },
    totalPaise: { type: Number, required: true },

    paidPaise: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["unpaid", "partial", "paid"],
        default: "unpaid"
    },
    notes: {
        type: String,
        default: null
    }
}, { timestamps: true })

billSchema.index({ businessId: 1, billNumber: 1 }, { unique: true })
billSchema.index({ businessId: 1, customerPhone: 1, status: 1 })

billSchema.virtual("outstandingPaise").get(function () {
    return this.totalPaise - this.paidPaise
})
billSchema.set("toJSON", { virtuals: true })
billSchema.set("toObject", { virtuals: true })

module.exports = mongoose.model("Bill", billSchema)
