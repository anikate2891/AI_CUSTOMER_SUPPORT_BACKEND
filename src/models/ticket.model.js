import mongoose from 'mongoose'

const ticketSchema = new mongoose.Schema({
    ticketNumber: {
        type: String,
        unique: true,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved'],
        default: 'open'
    },
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'business',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    assignedAgentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'agent',
        default: null
    },
}, { timestamps: true })

const ticketModel = mongoose.model('ticket', ticketSchema)
export default ticketModel