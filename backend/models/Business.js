const mongoose=require("mongoose")
const {Schema}=mongoose

const businessSchema=new Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    slug:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    ownerUserId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    gstNumber:{
        type:String,
        default:null
    },
    phone:{
        type:String,
        default:null
    },
    address:{
        type:String,
        default:null
    },
    plan:{
        type:String,
        enum:["trial","basic","pro"],
        default:"trial"
    },
    isActive:{
        type:Boolean,
        default:true
    }
},{timestamps:true})

module.exports=mongoose.model("Business",businessSchema)
