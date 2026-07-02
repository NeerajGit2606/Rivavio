const mongoose = require('mongoose')
const https = require('https')
require('./models/Category')
const Product = require('./models/Product')

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1) }

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => { try { resolve(JSON.parse(data)) } catch(e) { reject(e) } })
        }).on('error', reject)
    })
}

async function run() {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    // Fetch all dummyjson products across relevant categories
    const categories = ['beauty', 'fragrances', 'furniture', 'groceries', 'womens-watches', 'mens-watches', 'laptops', 'smartphones']
    const dummyMap = new Map() // title.lowercase -> product

    for (const cat of categories) {
        try {
            const data = await fetchJSON(`https://dummyjson.com/products/category/${cat}?limit=100`)
            for (const p of (data.products || [])) {
                dummyMap.set(p.title.toLowerCase().trim(), p)
            }
            console.log(`Fetched ${data.products?.length || 0} products from dummyjson/${cat}`)
        } catch (e) {
            console.log(`Failed to fetch ${cat}: ${e.message}`)
        }
    }

    // Also fetch all products in one go to catch any we missed
    try {
        const all = await fetchJSON('https://dummyjson.com/products?limit=194')
        for (const p of (all.products || [])) {
            if (!dummyMap.has(p.title.toLowerCase().trim())) {
                dummyMap.set(p.title.toLowerCase().trim(), p)
            }
        }
        console.log(`Total dummyjson products indexed: ${dummyMap.size}`)
    } catch (e) {
        console.log(`Failed to fetch all products: ${e.message}`)
    }

    const products = await Product.find({ isDeleted: false }).populate('category')
    console.log(`\nUpdating ${products.length} products in MongoDB...\n`)

    let matched = 0, unmatched = 0

    for (const p of products) {
        const key = p.title.toLowerCase().trim()
        const match = dummyMap.get(key)

        if (match && match.thumbnail) {
            await Product.updateOne({ _id: p._id }, {
                thumbnail: match.thumbnail,
                images: match.images?.length ? match.images : [match.thumbnail]
            })
            console.log(`✓ "${p.title}"`)
            matched++
        } else {
            // Fallback: assign based on category name
            const catName = (p.category?.name || '').toLowerCase()
            const fallbackMap = {
                beauty:     'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.webp',
                fragrances: 'https://cdn.dummyjson.com/products/images/fragrances/Calvin%20Klein%20CK%20One/1.webp',
                furniture:  'https://cdn.dummyjson.com/products/images/furniture/Annibale%20Colombo%20Bed/1.webp',
                groceries:  'https://cdn.dummyjson.com/products/images/groceries/Apple/1.webp',
                watches:    'https://cdn.dummyjson.com/products/images/mens-watches/Brown%20Leather%20Belt%20Watch/1.webp',
            }
            const fallback = fallbackMap[catName] || fallbackMap['beauty']
            await Product.updateOne({ _id: p._id }, {
                thumbnail: fallback,
                images: [fallback]
            })
            console.log(`~ "${p.title}" (no match, used category fallback)`)
            unmatched++
        }
    }

    console.log(`\nDone. Matched: ${matched} | Fallback: ${unmatched}`)
    await mongoose.disconnect()
}

run().catch(e => { console.error(e); process.exit(1) })
