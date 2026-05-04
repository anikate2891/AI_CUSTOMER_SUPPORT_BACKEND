import { crawlAndSave } from "../config/crawl.config.js";
import sendEmail from "../config/sendEmail.config.js";
import businessModel from "../models/business.model.js";
import { generateInviteCode } from "../utils/generate-invite-code.js";
import { config } from "../config/config.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import knowledgeChunkModel from "../models/knowledge.model.js";

export const businessRegister = async (req, res) => {
    try {
        const { organization, websiteURL, businessEmail, businessPassword } = req.body
        const existingBusiness = await businessModel.findOne({ businessEmail })
        if (existingBusiness) return res.status(409).json({ message: "Business with that email already exists" })

        const registeredBusiness = await businessModel.create({
            organization, websiteURL, businessEmail, businessPassword, isCrawling: "crawling",
        })

        const token = jwt.sign({ businessId: registeredBusiness._id }, config.JWT_SECRET, { expiresIn: '7d' })

        res.cookie("businessToken", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        await crawlAndSave(registeredBusiness._id, websiteURL).catch(e => console.error("Crawl error:", e.message))

        sendEmail(businessEmail, `Verify Your SupportAI Account`,
            `Hi ${organization}, please verify your email: ${config.BACKEND_URL}/api/business/verify-email?token=${token}`,
            `<div><a href="${config.BACKEND_URL}/api/business/verify-email?token=${token}">Verify Email</a></div>`
        ).catch(e => console.error("Email error:", e.message))

        res.status(201).json({
            message: "Business registered successfully.",
            user: { id: registeredBusiness._id, organization: registeredBusiness.organization, email: registeredBusiness.businessEmail, role: 'business' }
        })
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ message: error.message })
    }
}

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query
        const decoded = jwt.verify(token, config.JWT_SECRET)
        const business = await businessModel.findOne({ _id: decoded.businessId })
        if (!business) return res.status(403).json({ message: "business not found" })
        business.isVerified = true
        await business.save()
        return res.redirect(`${config.FRONTEND_URL}/login`)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const businessLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingBusiness = await businessModel.findOne({ businessEmail: email }).select("+businessPassword");
        if (!existingBusiness) return res.status(404).json({ message: "Business with that email doesn't exist" });
        const comparedPassword = await bcrypt.compare(password, existingBusiness.businessPassword);
        if (!comparedPassword) return res.status(401).json({ message: "Invalid credentials" });
        if (!existingBusiness.isVerified) return res.status(403).json({ message: "business not verified" });

        const token = jwt.sign({ businessId: existingBusiness._id }, config.JWT_SECRET, { expiresIn: '7d' })
        res.cookie("businessToken", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            message: "Business loggedIn successfully",
            user: { id: existingBusiness._id, organization: existingBusiness.organization, email: existingBusiness.businessEmail }
        })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
};

export const businessCheck = async (req, res) => {
    try {
        const business = await businessModel.findOne({ _id: req.business.businessId }).select("-businessPassword");
        if (!business) return res.status(404).json({ message: "Business not found" });
        res.status(200).json({ business });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const inviteAgents = async (req, res) => {
    try {
        const businessId = req.business.businessId
        const { agentEmail, agentName } = req.body
        const business = await businessModel.findOne({ _id: businessId })
        if (!business) return res.status(400).json({ message: 'Bad request' })
        const code = generateInviteCode()
        await sendEmail(agentEmail, `You're Invited to Join ${business.organization} as an Agent`,
            `Dear ${agentName}, your invite code is: ${code}. Register at: ${config.FRONTEND_URL}/register`,
            `<div><p>Code: <strong>${code}</strong></p><a href="${config.FRONTEND_URL}/register">Register</a></div>`
        )
        business.inviteCode = code
        await business.save()
        res.status(200).json({ message: 'Invitation sent successfully' })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const logoutBusiness = (req, res) => {
    res.clearCookie('businessToken', { httpOnly: true, sameSite: 'none', secure: true });
    return res.status(200).json({ message: 'Business logged out successfully' });
};

export const getInfoAboutBusiness = async (req, res) => {
    try {
        const { businessId } = req.params
        const data = await knowledgeChunkModel.findOne({ businessId })
        res.status(200).json({ textData: data.text })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const getAllBusinesses = async (req, res) => {
    try {
        const businesses = await businessModel.find({ isVerified: true }).select('_id organization')
        res.status(200).json({ businesses })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}