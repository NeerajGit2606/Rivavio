const mongoose=require("mongoose")
const {Schema}=mongoose

const cartSchema=new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    product:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },
    quantity:{
        type:Number,
        default:1,
    },
    reminderSent:{
        type:Boolean,
        default:false
    }
},{versionKey:false,timestamps:true})

module.exports=mongoose.model("Cart",cartSchema)