const mongoose = require("mongoose")
const Bill = require("../models/Bill")
const LedgerEntry = require("../models/LedgerEntry")
const { allocatePaymentFIFO } = require("../utils/ledgerEngine")

exports.recordPayment = async (req, res) => {
    try {
        const { customerPhone, amountPaise } = req.body

        if (!customerPhone || !Number.isInteger(amountPaise) || amountPaise <= 0) {
            return res.status(400).json({ message: "customerPhone and a positive integer amountPaise are required" })
        }

        const openBills = await Bill.find({
            businessId: req.businessId,
            customerPhone,
            status: { $in: ["unpaid", "partial"] }
        })

        const outstandingBills = openBills.map((bill) => ({
            billId: String(bill._id),
            outstandingPaise: bill.outstandingPaise,
            dueDate: bill.dueDate
        }))

        const { allocations, unallocatedPaise } = allocatePaymentFIFO(amountPaise, outstandingBills)
        const paymentGroupId = new mongoose.Types.ObjectId()
        const updatedBills = []

        const session = await mongoose.startSession()
        try {
            await session.withTransaction(async () => {
                for (const allocation of allocations) {
                    if (allocation.allocatedPaise <= 0) continue

                    // aggregation-pipeline update: increments paidPaise and recomputes status
                    // from whatever paidPaise IS in the DB at write time, in one atomic step --
                    // no separate read-modify-write round trip
                    const updatedBill = await Bill.findOneAndUpdate(
                        { _id: allocation.billId, businessId: req.businessId, status: { $in: ["unpaid", "partial"] } },
                        [
                            { $set: { paidPaise: { $add: ["$paidPaise", allocation.allocatedPaise] } } },
                            { $set: { status: {
                                $cond: [
                                    { $gte: ["$paidPaise", "$totalPaise"] }, "paid",
                                    { $cond: [{ $gt: ["$paidPaise", 0] }, "partial", "unpaid"] }
                                ]
                            } } }
                        ],
                        { new: true, session }
                    )

                    if (!updatedBill) {
                        throw new Error(`Bill ${allocation.billId} was not available for allocation (concurrently modified)`)
                    }

                    await LedgerEntry.create([{
                        businessId: req.businessId,
                        billId: updatedBill._id,
                        type: "credit",
                        amountPaise: allocation.allocatedPaise,
                        balanceAfterPaise: updatedBill.outstandingPaise,
                        reason: "payment_received",
                        paymentGroupId
                    }], { session })

                    updatedBills.push(updatedBill)
                }
            })
        } finally {
            await session.endSession()
        }

        res.status(200).json({ allocations, unallocatedPaise, updatedBills })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error recording payment, please try again later" })
    }
}

exports.getAll = async (req, res) => {
    try {
        const entries = await LedgerEntry.find({ businessId: req.businessId }).sort({ createdAt: -1 })
        res.status(200).json(entries)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error fetching ledger, please try again later" })
    }
}

exports.getByBill = async (req, res) => {
    try {
        const bill = await Bill.findOne({ _id: req.params.id, businessId: req.businessId })

        if (!bill) {
            return res.status(404).json({ message: "Bill not found" })
        }

        const entries = await LedgerEntry.find({ businessId: req.businessId, billId: bill._id }).sort({ createdAt: 1 })
        res.status(200).json(entries)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error fetching ledger, please try again later" })
    }
}
