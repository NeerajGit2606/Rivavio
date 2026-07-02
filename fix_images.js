const mongoose = require('mongoose')

// Must require Category BEFORE Product (populate needs it registered)
const Category = require('./models/Category')
const Product = require('./models/Product')

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1) }

// Category name → local image pool (served by Nginx at /images/products/)
const categoryImages = {
    beauty:     ['beauty-1.jpg', 'beauty-2.jpg', 'beauty-3.jpg'],
    fragrance:  ['fragrance-1.jpg', 'fragrance-2.jpg', 'fragrance-3.jpg'],
    fragrances: ['fragrance-1.jpg', 'fragrance-2.jpg', 'fragrance-3.jpg'],
    furniture:  ['furniture-1.jpg', 'furniture-2.jpg', 'furniture-3.jpg'],
    grocery:    ['grocery-1.jpg', 'grocery-2.jpg', 'grocery-3.jpg'],
    groceries:  ['grocery-1.jpg', 'grocery-2.jpg', 'grocery-3.jpg'],
    watch:      ['watch-1.jpg', 'watch-2.jpg'],
    watches:    ['watch-1.jpg', 'watch-2.jpg'],
}
const fallback = ['product-1.jpg', 'product-2.jpg', 'product-3.jpg', 'product-4.jpg', 'product-5.jpg']

function pick(pool, index) {
    return '/images/products/' + pool[index % pool.length]
}

async function run() {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    const products = await Product.find({ isDeleted: false }).populate('category')
    console.log(`Found ${products.length} products`)

    let updated = 0
    for (let i = 0; i < products.length; i++) {
        const p = products[i]
        const catName = (p.category?.name || '').toLowerCase()
        const pool = categoryImages[catName] || fallback

        const thumbnail = pick(pool, i)
        const images = [pick(pool, i), pick(pool, i + 1), pick(pool, i + 2)]

        await Product.updateOne({ _id: p._id }, { thumbnail, images })
        console.log(`[${i + 1}/${products.length}] "${p.title}" → ${thumbnail}`)
        updated++
    }

    console.log(`\nDone. Updated ${updated} products.`)
    await mongoose.disconnect()
}

run().catch(e => { console.error(e); process.exit(1) })
