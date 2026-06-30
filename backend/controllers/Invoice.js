const PDFDocument = require("pdfkit")
const Order = require("../models/Order")
const User = require("../models/User")

exports.generateInvoice = async (req, res) => {
    try {
        const { id } = req.params
        const order = await Order.findById(id)

        if (!order) {
            return res.status(404).json({ message: 'Order not found' })
        }

        // Only the order's own user (or an admin) may download the invoice
        if (String(order.user) !== String(req.user._id) && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this invoice' })
        }

        const user = await User.findById(order.user)

        const doc = new PDFDocument({ margin: 50 })
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`)
        doc.pipe(res)

        doc.fontSize(20).text('Invoice', { align: 'right' })
        doc.moveDown()
        doc.fontSize(10).text(`Order ID: ${order._id}`, { align: 'right' })
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'right' })
        doc.moveDown()

        doc.fontSize(12).text(`Billed to: ${user?.name || ''}`)
        doc.text(`Email: ${user?.email || ''}`)
        const addr = Array.isArray(order.address) ? order.address[0] : order.address
        if (addr) {
            doc.text(`Address: ${[addr.street, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean).join(', ')}`)
        }
        doc.moveDown()

        doc.fontSize(12).text('Items', { underline: true })
        doc.moveDown(0.5)

        const items = Array.isArray(order.item) ? order.item : []
        items.forEach((item) => {
            const title = item?.product?.title || 'Item'
            const qty = item?.quantity || 1
            const price = item?.product?.price || 0
            doc.fontSize(10).text(`${title}  x${qty}  -  ₹${price * qty}`)
        })

        doc.moveDown()
        if (order.discountAmount > 0) {
            doc.text(`Discount (${order.couponCode || ''}): -₹${order.discountAmount}`)
        }
        if (order.walletAmountUsed > 0) {
            doc.text(`Wallet used: -₹${order.walletAmountUsed}`)
        }
        doc.fontSize(12).text(`Total Paid: ₹${order.total}`, { underline: true })
        doc.moveDown()
        doc.fontSize(10).text(`Payment Mode: ${order.paymentMode}`)
        doc.text(`Payment Status: ${order.paymentStatus}`)
        doc.text(`Order Status: ${order.status}`)

        doc.end()

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error generating invoice, please try again later' })
    }
}
