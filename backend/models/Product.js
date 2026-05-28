const mongoose=require("mongoose")
const {Schema}=mongoose

const variantSchema = new Schema({
    size: { type: String },   // e.g. 'XS','S','M','L','XL'
    color: { type: String },  // hex string e.g. '#FF0000' or label e.g. 'Red'
    colorHex: { type: String }, // actual hex for rendering swatch
    stock: { type: Number, default: 0 }
}, { _id: false })

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discountPercentage: {
        type: Number,
        default: 0,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    brand: {
        type: Schema.Types.ObjectId,
        ref: "Brand",
        required: true
    },
    stockQuantity: {
        type: Number,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    // ── NEW: variants (size + color combinations) ──────────────────────────
    variants:{
        type:[variantSchema],
        default:[]
    },
    // ── NEW: available sizes & colors lists (derived, for fast filtering) ──
    availableSizes:{
        type:[String],
        default:[]
    },
    availableColors:{
        type:[{ label:String, hex:String }],
        default:[]
    },
    averageRating:{
        type:Number,
        default:0
    }
},{timestamps:true,versionKey:false})

// Text index for full-text search on title + description
productSchema.index({ title: 'text', description: 'text' })

module.exports = mongoose.model('Product', productSchema)