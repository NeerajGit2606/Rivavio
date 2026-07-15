// backend/index.js - CLEAN COPY

require("dotenv").config()
const express = require('express')
const cors = require('cors')
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const authRoutes = require("./routes/Auth")
const productRoutes = require("./routes/Product")
const orderRoutes = require("./routes/Order")
const cartRoutes = require("./routes/Cart")
const brandRoutes = require("./routes/Brand")
const categoryRoutes = require("./routes/Category")
const userRoutes = require("./routes/User")
const addressRoutes = require('./routes/Address')
const reviewRoutes = require("./routes/Review")
const wishlistRoutes = require("./routes/Wishlist")
const paymentRoutes = require("./routes/Payment")
const couponRoutes = require("./routes/Coupon")
const saasRoutes = require("./routes/Saas")
const { connectToDB } = require("./database/db")
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./swagger')
const { passport } = require("./config/passport")
const { startAbandonedCartCron } = require("./utils/AbandonedCartCron")

const server = express()
connectToDB()

server.use(cors({
    origin: process.env.ORIGIN || 'http://localhost:3000',
    credentials: true,
    exposedHeaders: ['X-Total-Count'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
}))
server.use(express.json())
server.use(cookieParser())
server.use(morgan("tiny"))
server.use(passport.initialize())

server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
server.use("/api/auth", authRoutes)
server.use("/api/users", userRoutes)
server.use("/api/products", productRoutes)
server.use("/api/orders", orderRoutes)
server.use("/api/cart", cartRoutes)
server.use("/api/brands", brandRoutes)
server.use("/api/categories", categoryRoutes)
server.use("/api/address", addressRoutes)
server.use("/api/reviews", reviewRoutes)
server.use("/api/wishlist", wishlistRoutes)
server.use("/api/payment", paymentRoutes)
server.use("/api/coupons", couponRoutes)
server.use("/api/saas", saasRoutes)

server.get("/", (req, res) => {
    res.status(200).json({ message: 'running' })
})

startAbandonedCartCron()

server.listen(8000, () => {
    console.log('✅ server [STARTED] ~ http://localhost:8000');
    console.log('✅ API Base: http://localhost:8000/api');
    console.log('✅ Products: http://localhost:8000/api/products');
})