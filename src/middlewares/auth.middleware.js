import jwt from "jsonwebtoken";
import {config} from "../config/config.js";
import userModel from "../models/user.model.js";


export const authenticateUser = async (req, res, next) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided." });
    }
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await userModel.findById(decoded.id);
        if(!user){
            return res.status(404).json({ message: "User not found." });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token." });
    }   
}
  

