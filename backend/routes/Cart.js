const express = require('express')
const cartController = require('../controllers/Cart')
const router = express.Router()

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
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
 *               - product
 *               - quantity
 *             properties:
 *               user:
 *                 type: string
 *                 example: "64a1b2c3d4e5f6789abc0001"
 *               product:
 *                 type: string
 *                 example: "64a1b2c3d4e5f6789abc0002"
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       500:
 *         description: Server error
 */
router.post("/", cartController.create)

/**
 * @swagger
 * /cart/user/{id}:
 *   get:
 *     summary: Get cart items by user ID
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of cart items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Cart'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/user/:id", cartController.getByUserId)

/**
 * @swagger
 * /cart/{id}:
 *   patch:
 *     summary: Update cart item by ID
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", cartController.updateById)

/**
 * @swagger
 * /cart/{id}:
 *   delete:
 *     summary: Delete cart item by ID
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Cart item deleted
 *       404:
 *         description: Cart item not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", cartController.deleteById)

/**
 * @swagger
 * /cart/user/{id}:
 *   delete:
 *     summary: Clear all cart items for a user
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Cart cleared for user
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/user/:id", cartController.deleteByUserId)

module.exports = router