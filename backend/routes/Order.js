const express = require('express')
const orderController = require("../controllers/Order")
const invoiceController = require("../controllers/Invoice")
const { authMiddleware, adminMiddleware } = require("../middleware/auth")
const router = express.Router()

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - items
 *               - totalAmount
 *               - paymentMethod
 *             properties:
 *               user:
 *                 type: string
 *                 example: "64a1b2c3d4e5f6789abc0001"
 *               items:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64a1b2c3d4e5f6789abc0002"]
 *               totalAmount:
 *                 type: number
 *                 example: 4999
 *               paymentMethod:
 *                 type: string
 *                 example: "Credit Card"
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       500:
 *         description: Server error
 */
router.post("/", authMiddleware, orderController.create)

/**
 * @swagger
 * /orders/analytics:
 *   get:
 *     summary: Get sales analytics (Admin only)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 */
router.get("/analytics", adminMiddleware, orderController.getAnalytics)

/**
 * @swagger
 * /orders/{id}/invoice:
 *   get:
 *     summary: Download invoice PDF for an order
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 */
router.get("/:id/invoice", authMiddleware, invoiceController.generateInvoice)

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get("/", adminMiddleware, orderController.getAll)

/**
 * @swagger
 * /orders/user/{id}:
 *   get:
 *     summary: Get orders by user ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of orders for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/user/:id", orderController.getByUserId)

/**
 * @swagger
 * /orders/{id}:
 *   patch:
 *     summary: Update order by ID
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "Shipped"
 *               trackingNumber:
 *                 type: string
 *                 example: "TRK123456789"
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", adminMiddleware, orderController.updateById)

module.exports = router