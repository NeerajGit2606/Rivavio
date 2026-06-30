const express = require("express")
const couponController = require("../controllers/Coupon")
const { adminMiddleware, authMiddleware } = require("../middleware/auth")
const router = express.Router()

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create a new coupon (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - cookieAuth: []
 */
router.post("/", adminMiddleware, couponController.create)

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Get all coupons (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - cookieAuth: []
 */
router.get("/", adminMiddleware, couponController.getAll)

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: Delete a coupon (Admin only)
 *     tags: [Coupons]
 *     security:
 *       - cookieAuth: []
 */
router.delete("/:id", adminMiddleware, couponController.deleteById)

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     summary: Validate a coupon code against the current cart total
 *     tags: [Coupons]
 *     security:
 *       - cookieAuth: []
 */
router.post("/validate", authMiddleware, couponController.validateCoupon)

module.exports = router
