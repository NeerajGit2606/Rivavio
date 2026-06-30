const cron = require("node-cron")
const Cart = require("../models/Cart")
const User = require("../models/User")
const { sendMail } = require("./Emails")

const ABANDONED_AFTER_HOURS = 3

const sendAbandonedCartReminders = async () => {
    try {
        const cutoff = new Date(Date.now() - ABANDONED_AFTER_HOURS * 60 * 60 * 1000)

        const staleItems = await Cart.find({ updatedAt: { $lte: cutoff }, reminderSent: false })
            .populate('product')

        if (!staleItems.length) return

        const itemsByUser = new Map()
        staleItems.forEach((item) => {
            if (!itemsByUser.has(String(item.user))) itemsByUser.set(String(item.user), [])
            itemsByUser.get(String(item.user)).push(item)
        })

        for (const [userId, items] of itemsByUser) {
            const user = await User.findById(userId)
            if (!user?.email || user.isGuest) continue

            const list = items.map(i => `<li>${i.product?.title || 'Item'} x${i.quantity}</li>`).join('')
            await sendMail(
                user.email,
                "You left something in your cart",
                `<p>Hi ${user.name},</p><p>You still have items waiting in your cart:</p><ul>${list}</ul><p>Come back and complete your order before they sell out!</p>`
            )

            await Cart.updateMany({ _id: { $in: items.map(i => i._id) } }, { reminderSent: true })
        }
    } catch (error) {
        console.log('Abandoned cart reminder job failed:', error.message)
    }
}

exports.startAbandonedCartCron = () => {
    // Runs every hour on the hour
    cron.schedule('0 * * * *', sendAbandonedCartReminders)
}
