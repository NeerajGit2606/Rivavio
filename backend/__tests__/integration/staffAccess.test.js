const mongoose = require("mongoose")
const { MongoMemoryReplSet } = require("mongodb-memory-server")
const User = require("../../models/User")
const businessController = require("../../controllers/Business")
const { ownerMiddleware } = require("../../middleware/tenant")
const { generateToken } = require("../../utils/GenerateToken")

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

// Runs an Express-style middleware (verifyToken is async internally, callback-continuation
// style) and resolves once it either calls next() or sends a response -- avoids racing the
// middleware's internal await.
function runMiddleware(middleware, req) {
    return new Promise((resolve) => {
        const res = mockRes()
        const next = jest.fn(() => resolve({ nextCalled: true, res }))
        const originalJson = res.json
        res.json = jest.fn((...args) => {
            originalJson(...args)
            resolve({ nextCalled: false, res })
            return res
        })
        middleware(req, res, next)
    })
}

const createUser = async (overrides = {}) => {
    const user = new User({
        name: "Test User",
        email: `user-${Date.now()}-${Math.random()}@example.com`,
        password: "hashed",
        ...overrides
    })
    await user.save()
    return user
}

describe("inviteStaff", () => {
    test("owner successfully invites an existing user", async () => {
        const owner = await createUser({ businessId: new mongoose.Types.ObjectId(), role: "owner" })
        const invitee = await createUser()

        const res = mockRes()
        await businessController.inviteStaff(
            { user: { _id: owner._id }, businessId: owner.businessId, body: { email: invitee.email } },
            res
        )

        expect(res.status).toHaveBeenCalledWith(200)
        const updated = await User.findById(invitee._id)
        expect(String(updated.businessId)).toBe(String(owner.businessId))
        expect(updated.role).toBe("staff")
    })

    test("rejects inviting a nonexistent email", async () => {
        const owner = await createUser({ businessId: new mongoose.Types.ObjectId(), role: "owner" })
        const res = mockRes()

        await businessController.inviteStaff(
            { user: { _id: owner._id }, businessId: owner.businessId, body: { email: "nobody@example.com" } },
            res
        )

        expect(res.status).toHaveBeenCalledWith(404)
    })

    test("rejects inviting yourself", async () => {
        const owner = await createUser({ businessId: new mongoose.Types.ObjectId(), role: "owner" })
        const res = mockRes()

        await businessController.inviteStaff(
            { user: { _id: owner._id }, businessId: owner.businessId, body: { email: owner.email } },
            res
        )

        expect(res.status).toHaveBeenCalledWith(400)
    })

    test("rejects inviting someone who already belongs to another business", async () => {
        const owner = await createUser({ businessId: new mongoose.Types.ObjectId(), role: "owner" })
        const elsewhereBusinessId = new mongoose.Types.ObjectId()
        const invitee = await createUser({ businessId: elsewhereBusinessId, role: "staff" })

        const res = mockRes()
        await businessController.inviteStaff(
            { user: { _id: owner._id }, businessId: owner.businessId, body: { email: invitee.email } },
            res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        const unchanged = await User.findById(invitee._id)
        expect(String(unchanged.businessId)).toBe(String(elsewhereBusinessId))
    })

    test("rejects inviting the same person twice", async () => {
        const businessId = new mongoose.Types.ObjectId()
        const owner = await createUser({ businessId, role: "owner" })
        const invitee = await createUser()
        const req = { user: { _id: owner._id }, businessId, body: { email: invitee.email } }

        await businessController.inviteStaff(req, mockRes())

        const res2 = mockRes()
        await businessController.inviteStaff(req, res2)
        expect(res2.status).toHaveBeenCalledWith(400)
    })
})

describe("listStaff", () => {
    test("returns both owner and staff for the business, never a password field", async () => {
        const businessId = new mongoose.Types.ObjectId()
        await createUser({ businessId, role: "owner" })
        await createUser({ businessId, role: "staff" })
        await createUser() // unrelated user, no business -- must not appear

        const res = mockRes()
        await businessController.listStaff({ businessId }, res)

        const members = res.json.mock.calls[0][0]
        expect(members).toHaveLength(2)
        expect(members.every((m) => m.password === undefined)).toBe(true)
    })
})

describe("removeStaff", () => {
    test("owner can remove a staff member, their businessId/role revert to null", async () => {
        const businessId = new mongoose.Types.ObjectId()
        await createUser({ businessId, role: "owner" })
        const staff = await createUser({ businessId, role: "staff" })

        const res = mockRes()
        await businessController.removeStaff({ businessId, params: { userId: String(staff._id) } }, res)

        expect(res.status).toHaveBeenCalledWith(200)
        const updated = await User.findById(staff._id)
        expect(updated.businessId).toBeNull()
        expect(updated.role).toBeNull()
    })

    test("cannot remove the business owner", async () => {
        const businessId = new mongoose.Types.ObjectId()
        const owner = await createUser({ businessId, role: "owner" })

        const res = mockRes()
        await businessController.removeStaff({ businessId, params: { userId: String(owner._id) } }, res)

        expect(res.status).toHaveBeenCalledWith(400)
        const unchanged = await User.findById(owner._id)
        expect(unchanged.role).toBe("owner")
    })
})

describe("ownerMiddleware", () => {
    test("blocks a staff-role JWT with 403, never calls next()", async () => {
        const businessId = new mongoose.Types.ObjectId()
        const token = generateToken({
            _id: new mongoose.Types.ObjectId(), email: "staff@example.com",
            isVerified: true, isAdmin: false, businessId, role: "staff"
        })

        const { nextCalled, res } = await runMiddleware(ownerMiddleware, { cookies: { token } })

        expect(nextCalled).toBe(false)
        expect(res.status).toHaveBeenCalledWith(403)
    })

    test("allows an owner-role JWT through to next()", async () => {
        const businessId = new mongoose.Types.ObjectId()
        const token = generateToken({
            _id: new mongoose.Types.ObjectId(), email: "owner@example.com",
            isVerified: true, isAdmin: false, businessId, role: "owner"
        })

        const { nextCalled } = await runMiddleware(ownerMiddleware, { cookies: { token } })

        expect(nextCalled).toBe(true)
    })
})
