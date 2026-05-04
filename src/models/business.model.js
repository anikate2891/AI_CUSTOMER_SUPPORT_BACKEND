import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const businessSchema = mongoose.Schema({
    organization:{
        type:String,
        required:true,
    },
    websiteURL:{
        type:String,
        required:true,
    },
    businessEmail:{
        type:String,
        required:true,
        unique:true,
    },
    isCrawling:{
        type:String,
        enum:['pending', 'crawling', 'done', 'failed'],
        default:'pending'
    },
    
    businessPassword:{
        type:String,
        required:true,
        select:false,
    },

    inviteCode:{
        type:String,
        default:null,
    },
    
    isVerified:{
        type:Boolean,
        default:false
    }
}, {timestamps:true})

businessSchema.pre("save", async function(){
    if(!this.isModified('businessPassword')) return;
    this.businessPassword = await bcrypt.hash(this.businessPassword, 10)
})


const businessModel = mongoose.model("business", businessSchema)
export default businessModel