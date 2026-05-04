import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'

export const authenticateAgent = (req,res,next) => {
    try {
        const token = req.cookies.agentToken
        if(!token) return res.status(401).json({message:"Unauthorized: No agent token provided."})
        const decoded = jwt.verify(token, config.JWT_SECRET)
        req.agent = decoded
        next()
    } catch (error) {
        res.status(401).json({message:"Unauthorized: Invalid agent token."})
    }
}
