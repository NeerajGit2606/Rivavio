const mongoose = require("mongoose")
const Bill = require("../models/Bill")
const LedgerEntry = require("../models/LedgerEntry")
const { calculateJewelryPrice } = require("../utils/jewelryPricing")
const { getNextSequence } = require("../utils/counter")

exports.create = async (req, res) => {
    const { customerName, customerPhone, dueDate, notes, ...pricingParams } = req.body

    if (!customerName || !customerPhone || !dueDate) {
        return res.status(400).json({ message: "customerName, customerPhone and dueDate are required" })
    }

    let pricing
    try {
        pricing = calculateJewelryPrice(pricingParams)
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }

    const session = await mongoose.startSession()
    try {
        let createdBill

        await session.withTransaction(async () => {
            const billNumber = await getNextSequence(`bill:${req.businessId}`, session)

            const [bill] = await Bill.create([{
                businessId: req.businessId,
                billNumber,
                customerName,
                customerPhone,
                dueDate,
                notes: notes || null,
                pricingInputs: {
                    grossWeightGrams: pricingParams.grossWeightGrams,
                    ratePerGram: pricingParams.ratePerGram,
                    wastagePercent: pricingParams.wastagePercent || 0,
                    makingChargeType: pricingParams.makingChargeType,
                    makingChargeValue: pricingParams.makingChargeValue,
                    makingChargeBasis: pricingParams.makingChargeBasis || "total",
                    gstPercent: pricingParams.gstPercent ?? 3
                },
                ...pricing
            }], { session })
            createdBill = bill

            await LedgerEntry.create([{
                businessId: req.businessId,
                billId: bill._id,
                type: "debit",
                amountPaise: bill.totalPaise,
                balanceAfterPaise: bill.totalPaise,
                reason: "bill_created"
            }], { session })
        })

        res.status(201).json(createdBill)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error creating bill, please try again later" })
    } finally {
        await session.endSession()
    }
}

exports.getAll = async (req, res) => {
    try {
        const bills = await Bill.find({ businessId: req.businessId }).sort({ billNumber: -1 })
        res.status(200).json(bills)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error fetching bills, please try again later" })
    }
}

exports.getById = async (req, res) => {
    try {
        const bill = await Bill.findOne({ _id: req.params.id, businessId: req.businessId })

        if (!bill) {
            return res.status(404).json({ message: "Bill not found" })
        }

        res.status(200).json(bill)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error fetching bill, please try again later" })
    }
}
