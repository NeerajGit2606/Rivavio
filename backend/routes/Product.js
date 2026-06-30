const express = require('express')
const multer = require('multer')
const productController = require("../controllers/Product")
const { adminMiddleware } = require("../middleware/auth")
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       500:
 *         description: Server error
 */
router.post("/", adminMiddleware, productController.create)

/**
 * @swagger
 * /products/bulk-upload:
 *   post:
 *     summary: Bulk create products from a CSV file (Admin only)
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Products created successfully
 *       400:
 *         description: Invalid CSV
 *       500:
 *         description: Server error
 */
router.post("/bulk-upload", adminMiddleware, upload.single('file'), productController.bulkUpload)

/**
 * @swagger
 * /products/{id}/recommendations:
 *   get:
 *     summary: Get related products for a given product (same category)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of related products
 */
router.get("/:id/recommendations", productController.getRecommendations)

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products (with filters, pagination, sorting)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: List of products
 *         headers:
 *           X-Total-Count:
 *             schema:
 *               type: integer
 *             description: Total products count
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       500:
 *         description: Server error
 */
router.get("/", productController.getAll)

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get("/:id", productController.getById)

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update product by ID
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", adminMiddleware, productController.updateById)

/**
 * @swagger
 * /products/undelete/{id}:
 *   patch:
 *     summary: Restore a soft-deleted product
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.patch("/undelete/:id", adminMiddleware, productController.undeleteById)

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Soft delete product by ID
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", adminMiddleware, productController.deleteById)

module.exports = router