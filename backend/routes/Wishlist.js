const express = require("express")
const wishlistController = require("../controllers/Wishlist")
const router = express.Router()

/**
 * @swagger
 * /wishlist:
 *   post:
 *     summary: Add item to wishlist
 *     tags: [Wishlist]
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
 *             properties:
 *               user:
 *                 type: string
 *                 example: "64a1b2c3d4e5f6789abc0001"
 *               product:
 *                 type: string
 *                 example: "64a1b2c3d4e5f6789abc0002"
 *     responses:
 *       201:
 *         description: Item added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wishlist'
 *       500:
 *         description: Server error
 */
router.post("/", wishlistController.create)

/**
 * @swagger
 * /wishlist/user/{id}:
 *   get:
 *     summary: Get wishlist items by user ID
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of wishlist items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Wishlist'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/user/:id", wishlistController.getByUserId)

/**
 * @swagger
 * /wishlist/{id}:
 *   patch:
 *     summary: Update wishlist item by ID
 *     tags: [Wishlist]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 example: "64a1b2c3d4e5f6789abc0003"
 *     responses:
 *       200:
 *         description: Wishlist item updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wishlist'
 *       404:
 *         description: Wishlist item not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", wishlistController.updateById)

/**
 * @swagger
 * /wishlist/{id}:
 *   delete:
 *     summary: Delete wishlist item by ID
 *     tags: [Wishlist]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Wishlist item ID
 *     responses:
 *       200:
 *         description: Wishlist item deleted
 *       404:
 *         description: Wishlist item not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", wishlistController.deleteById)

module.exports = router