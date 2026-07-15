const mongoose = require("mongoose")
const { Schema } = mongoose

const forbidMutation = function () {
    throw new Error("LedgerEntry is append-only and cannot be modified or deleted")
}

const ledgerEntrySchema = new Schema({
    businessId: {
        type: Schema.Types.ObjectId,
        ref: "Business",
        required: true
    },
    billId: {
        type: Schema.Types.ObjectId,
        ref: "Bill",
        required: true
    },
    type: {
        type: String,
        enum: ["debit", "credit"],
        required: true
    },
    amountPaise: {
        type: Number,
        required: true,
        min: 1
    },
    balanceAfterPaise: {
        type: Number,
        required: true,
        min: 0
    },
    reason: {
        type: String,
        enum: ["bill_created", "payment_received"],
        required: true
    },
    paymentGroupId: {
        type: Schema.Types.ObjectId,
        default: null
    }
}, { timestamps: { createdAt: true, updatedAt: false } })

ledgerEntrySchema.index({ businessId: 1, billId: 1, createdAt: 1 })
ledgerEntrySchema.index({ businessId: 1, createdAt: -1 })

ledgerEntrySchema.pre(["updateOne", "findOneAndUpdate", "deleteOne", "findOneAndDelete", "updateMany", "deleteMany"], forbidMutation)

module.exports = mongoose.model("LedgerEntry", ledgerEntrySchema)
