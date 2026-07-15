const mongoose = require("mongoose")
const { MongoMemoryReplSet } = require("mongodb-memory-server")
const Bill = require("../../models/Bill")
const LedgerEntry = require("../../models/LedgerEntry")
const billController = require("../../controllers/Bill")
const ledgerController = require("../../controllers/Ledger")

jest.setTimeout(60000)

let replSet

beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
    await mongoose.connect(replSet.getUri())
})

afterEach(async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
    jest.restoreAllMocks()
})

afterAll(async () => {
    await mongoose.disconnect()
    await replSet.stop()
})

const mockRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const validPricingBody = (overrides = {}) => ({
    customerName: "Test Customer",
    customerPhone: "9999999999",
    dueDate: new Date("2026-01-01"),
    grossWeightGrams: 10,
    ratePerGram: 6000,
    makingChargeType: "flat",
    makingChargeValue: 500,
    gstPercent: 3,
    ...overrides
})

describe("createBill", () => {
    test("counter race safety: concurrent createBill calls never produce duplicate billNumbers", async () => {
        const businessId = new mongoose.Types.ObjectId()
        const res1 = mockRes()
        const res2 = mockRes()

        await Promise.all([
            billController.create({ businessId, body: validPricingBody() }, res1),
            billController.create({ businessId, body: validPricingBody() }, res2)
        ])

        expect(res1.status).toHaveBeenCalledWith(201)
        expect(res2.status).toHaveBeenCalledWith(201)

        const bills = await Bill.find({ businessId }).sort({ billNumber: 1 })
        expect(bills).toHaveLength(2)
        expect(bills.map((b) => b.billNumber)).toEqual([1, 2])
    })

    test("rejects invalid pricing input with 400, without touching the counter", async () => {
        const businessId = new mongoose.Types.ObjectId()
        const res = mockRes()

        await billController.create({ businessId, body: validPricingBody({ grossWeightGrams: -1 }) }, res)

        expect(res.status).toHaveBeenCalledWith(400)
        const bills = await Bill.find({ businessId })
        expect(bills).toHaveLength(0)
    })
})

describe("recordPayment", () => {
    test("persists paidPaise/status per bill and one credit LedgerEntry per allocation, matching allocatePaymentFIFO", async () => {
        const businessId = new mongoose.Types.ObjectId()
        const customerPhone = "8888888888"

        const resA = mockRes()
        await billController.create({ businessId, body: validPricingBody({ customerPhone, dueDate: new Date("2026-01-01") }) }, resA)
        const billA = resA.json.mock.calls[0][0]

        const resB = mockRes()
        await billController.create({ businessId, body: validPricingBody({ customerPhone, dueDate: new Date("2026-02-01") }) }, resB)
        const billB = resB.json.mock.calls[0][0]

        const paymentAmount = billA.totalPaise + 1000 // fully pays the older bill, partially pays the newer one

        const resPay = mockRes()
        await ledgerController.recordPayment({ businessId, body: { customerPhone, amountPaise: paymentAmount } }, resPay)

        expect(resPay.status).toHaveBeenCalledWith(200)
        const payload = resPay.json.mock.calls[0][0]
        expect(payload.allocations).toHaveLength(2)
        expect(payload.unallocatedPaise).toBe(0)

        const updatedA = await Bill.findById(billA._id)
        const updatedB = await Bill.findById(billB._id)
        expect(updatedA.status).toBe("paid")
        expect(updatedA.paidPaise).toBe(billA.totalPaise)
        expect(updatedB.status).toBe("partial")
        expect(updatedB.paidPaise).toBe(1000)

        const credits = await LedgerEntry.find({ businessId, type: "credit" })
        expect(credits).toHaveLength(2)
        expect(credits.every((c) => String(c.paymentGroupId) === String(credits[0].paymentGroupId))).toBe(true)
    })

    test("rollback: a mid-transaction failure leaves the DB fully unchanged", async () => {
        const businessId = new mongoose.Types.ObjectId()
        const customerPhone = "7777777777"

        const resA = mockRes()
        await billController.create({ businessId, body: validPricingBody({ customerPhone, dueDate: new Date("2026-01-01") }) }, resA)
        const billA = resA.json.mock.calls[0][0]

        const resB = mockRes()
        await billController.create({ businessId, body: validPricingBody({ customerPhone, dueDate: new Date("2026-02-01") }) }, resB)
        const billB = resB.json.mock.calls[0][0]

        const beforeBills = await Bill.find({ businessId }).sort({ billNumber: 1 }).lean()
        const beforeLedgerCount = await LedgerEntry.countDocuments({ businessId })

        // force a failure AFTER the first bill's paidPaise update has already run inside
        // the transaction, to prove the whole transaction rolls back, not just the failed step
        const originalCreate = LedgerEntry.create.bind(LedgerEntry)
        let call = 0
        jest.spyOn(LedgerEntry, "create").mockImplementation(async (...args) => {
            call++
            if (call === 2) throw new Error("simulated failure")
            return originalCreate(...args)
        })

        const paymentAmount = billA.totalPaise + billB.totalPaise
        const resPay = mockRes()
        await ledgerController.recordPayment({ businessId, body: { customerPhone, amountPaise: paymentAmount } }, resPay)

        expect(resPay.status).toHaveBeenCalledWith(500)

        const afterBills = await Bill.find({ businessId }).sort({ billNumber: 1 }).lean()
        const afterLedgerCount = await LedgerEntry.countDocuments({ businessId })

        expect(afterBills.map((b) => ({ paidPaise: b.paidPaise, status: b.status })))
            .toEqual(beforeBills.map((b) => ({ paidPaise: b.paidPaise, status: b.status })))
        expect(afterLedgerCount).toBe(beforeLedgerCount)
    })
})
