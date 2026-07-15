const mongoose = require("mongoose")
const { MongoMemoryReplSet } = require("mongodb-memory-server")
const Bill = require("../../models/Bill")
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
    customerPhone: "6666666666",
    dueDate: new Date("2026-01-01"),
    grossWeightGrams: 10,
    ratePerGram: 6000,
    makingChargeType: "flat",
    makingChargeValue: 500,
    gstPercent: 3,
    ...overrides
})

test("business A cannot read business B's bill or its ledger", async () => {
    const businessA = new mongoose.Types.ObjectId()
    const businessB = new mongoose.Types.ObjectId()

    const resCreate = mockRes()
    await billController.create({ businessId: businessB, body: validPricingBody() }, resCreate)
    const billB = resCreate.json.mock.calls[0][0]

    const resGet = mockRes()
    await billController.getById({ businessId: businessA, params: { id: billB._id } }, resGet)
    expect(resGet.status).toHaveBeenCalledWith(404)

    const resLedger = mockRes()
    await ledgerController.getByBill({ businessId: businessA, params: { id: billB._id } }, resLedger)
    expect(resLedger.status).toHaveBeenCalledWith(404)
})

test("business A's payment never applies to business B's bill, even with the same customerPhone", async () => {
    const businessA = new mongoose.Types.ObjectId()
    const businessB = new mongoose.Types.ObjectId()
    const sharedPhone = "6666666666"

    const resCreate = mockRes()
    await billController.create({ businessId: businessB, body: validPricingBody({ customerPhone: sharedPhone }) }, resCreate)
    const billB = resCreate.json.mock.calls[0][0]

    const resPay = mockRes()
    await ledgerController.recordPayment({ businessId: businessA, body: { customerPhone: sharedPhone, amountPaise: 100000 } }, resPay)

    expect(resPay.status).toHaveBeenCalledWith(200)
    const payload = resPay.json.mock.calls[0][0]
    expect(payload.allocations).toEqual([])
    expect(payload.unallocatedPaise).toBe(100000)

    const unchangedBillB = await Bill.findById(billB._id)
    expect(unchangedBillB.paidPaise).toBe(0)
    expect(unchangedBillB.status).toBe("unpaid")
})

test("business A only ever sees its own bills in getAll, never business B's", async () => {
    const businessA = new mongoose.Types.ObjectId()
    const businessB = new mongoose.Types.ObjectId()

    await billController.create({ businessId: businessA, body: validPricingBody({ customerPhone: "1111111111" }) }, mockRes())
    await billController.create({ businessId: businessB, body: validPricingBody({ customerPhone: "2222222222" }) }, mockRes())

    const resGetAll = mockRes()
    await billController.getAll({ businessId: businessA }, resGetAll)

    const bills = resGetAll.json.mock.calls[0][0]
    expect(bills).toHaveLength(1)
    expect(bills[0].customerPhone).toBe("1111111111")
})
