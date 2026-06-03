const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/Payment");
const { verifyToken } = require("../middleware/VerifyToken");

/**
 * @swagger
 * /payment/create-order:
 *   post:
 *     summary: Create a new payment order
 *     tags: [Payment]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 4999
 *               currency:
 *                 type: string
 *                 example: "INR"
 *     responses:
 *       201:
 *         description: Payment order created successfully
 *       500:
 *         description: Server error
 */
router.post("/create-order", verifyToken, paymentController.createOrder)

/**
 * @swagger
 * /payment/verify:
 *   post:
 *     summary: Verify payment status
 *     tags: [Payment]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - paymentId
 *               - signature
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "order_DBJOWzybf0sJbb"
 *               paymentId:
 *                 type: string
 *                 example: "pay_DBJOuTyf0sJbb"
 *               signature:
 *                 type: string
 *                 example: "generated_signature_string"
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Invalid signature or payment details
 *       500:
 *         description: Server error
 */
router.post("/verify", verifyToken, paymentController.verifyPayment)

module.exports = router;