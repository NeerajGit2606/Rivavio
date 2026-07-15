const express = require('express')
const businessController = require('../controllers/Business')
const billController = require('../controllers/Bill')
const ledgerController = require('../controllers/Ledger')
const { authMiddleware } = require('../middleware/auth')
const { tenantMiddleware, ownerMiddleware } = require('../middleware/tenant')
const router = express.Router()

router.post('/businesses', authMiddleware, businessController.create)
router.get('/businesses/me', tenantMiddleware, businessController.getMine)

router.post('/businesses/staff', ownerMiddleware, businessController.inviteStaff)
router.get('/businesses/staff', tenantMiddleware, businessController.listStaff)
router.delete('/businesses/staff/:userId', ownerMiddleware, businessController.removeStaff)

router.post('/bills', tenantMiddleware, billController.create)
router.get('/bills', tenantMiddleware, billController.getAll)
router.get('/bills/:id', tenantMiddleware, billController.getById)
router.get('/bills/:id/ledger', tenantMiddleware, ledgerController.getByBill)

router.post('/payments', tenantMiddleware, ledgerController.recordPayment)
router.get('/ledger', tenantMiddleware, ledgerController.getAll)

module.exports = router
