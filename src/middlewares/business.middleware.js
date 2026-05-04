import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'

export const authenticateBusiness = (req,res,next) => {
    const token = req.cookies.businessToken
    if(!token) return res.status(401).json({message:"Unauthorized: No business token provided."})

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET)
        req.business = decoded
        next()
    } catch (error) {
        return res.status(401).json({message:"Unauthorized: Invalid business token."})
    }
}