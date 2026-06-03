const express = require('express')
const addressController = require("../controllers/Address")
const router = express.Router()

/**
 * @swagger
 * /address:
 *   post:
 *     summary: Create a new address
 *     tags: [Address]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Address created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       500:
 *         description: Server error
 */
router.post("/", addressController.create)

/**
 * @swagger
 * /address/user/{id}:
 *   get:
 *     summary: Get addresses by user ID
 *     tags: [Address]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Address'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/user/:id", addressController.getByUserId)

/**
 * @swagger
 * /address/{id}:
 *   patch:
 *     summary: Update address by ID
 *     tags: [Address]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address updated
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", addressController.updateById)

/**
 * @swagger
 * /address/{id}:
 *   delete:
 *     summary: Delete address by ID
 *     tags: [Address]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", addressController.deleteById)

module.exports = router