import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const agentSchema = mongoose.Schema({
    agentFullName:{
        type:String,
        required:true,
    },
    agentEmail:{
        type:String,
        required:true,
        unique:true,
    },

    agentPassword:{
        type:String,
        required:true,
        minLength:6,
    },
    businessId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'business'
    },
    isVerified:{
        type:Boolean,
        default:false
    }
}, {timestamps:true})

agentSchema.pre('save', async function(){
    if(!this.isModified('agentPassword')) return
    this.agentPassword = await bcrypt.hash(this.agentPassword, 10)
})

const agentModel = mongoose.model('agent', agentSchema)
export default agentModel