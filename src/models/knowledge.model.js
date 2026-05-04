import mongoose from "mongoose"

const knowledgeChunkSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'business',
        required: true
    },
    sourceUrl: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    }
}, { timestamps: true })

const knowledgeChunkModel = mongoose.model('knowledgeChunk', knowledgeChunkSchema)

export default knowledgeChunkModel