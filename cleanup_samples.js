const mongoose = require('mongoose')
const Product = require('./models/Product')

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1) }

async function run() {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    const result = await Product.deleteMany({ title: /sample/i })
    console.log(`Deleted ${result.deletedCount} sample product(s)`)

    await mongoose.disconnect()
}

run().catch(e => { console.error(e); process.exit(1) })
