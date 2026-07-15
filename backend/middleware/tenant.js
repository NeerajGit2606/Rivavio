const { verifyToken } = require('./VerifyToken')

// Tenant = login check + must belong to a business
exports.tenantMiddleware = (req, res, next) => {
    verifyToken(req, res, () => {
        if (!req.user?.businessId) {
            return res.status(403).json({ message: "This action requires a business account. Create one via POST /api/saas/businesses." })
        }
        req.businessId = req.user.businessId
        next()
    })
}

// Owner = tenant check + must be the business owner, not just staff
exports.ownerMiddleware = (req, res, next) => {
    exports.tenantMiddleware(req, res, () => {
        if (req.user.role !== "owner") {
            return res.status(403).json({ message: "Only the business owner can perform this action" })
        }
        next()
    })
}
