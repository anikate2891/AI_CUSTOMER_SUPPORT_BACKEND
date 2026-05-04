import { crawlAndSave } from "../config/crawl.config.js";
import sendEmail from "../config/sendEmail.config.js";
import businessModel from "../models/business.model.js";
import { generateInviteCode } from "../utils/generate-invite-code.js";
import { config } from "../config/config.js";
import sendTokenResponse from "../utils/generateToken.js";
import bcrypt from "bcrypt";
import { tryAbsoluteURL } from "crawlee";
import jwt from "jsonwebtoken";
import knowledgeChunkModel from "../models/knowledge.model.js";

export const businessRegister = async (req, res) => {
    try {
        const { organization, websiteURL, businessEmail, businessPassword } = req.body

        const existingBusiness = await businessModel.findOne({ businessEmail })
        if (existingBusiness) return res.status(409).json({ message: "Business with that email already exists" })

        const registeredBusiness = await businessModel.create({
            organization,
            websiteURL,
            businessEmail,
            businessPassword,
            isCrawling: "crawling",
        })

        const token = jwt.sign({ businessId: registeredBusiness._id }, config.JWT_SECRET, { expiresIn: '7d' })

        res.cookie("businessToken", token, {
            httpOnly: true,
            secure: config.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

         await crawlAndSave(registeredBusiness._id, websiteURL)
            .catch(e => console.error("Crawl error:", e.message))

        sendEmail(
             businessEmail,
    `Verify Your SupportAI Account`,
    `Hi ${organization}, please verify your email: http://localhost:8000/api/business/verify-email?token=${token}`,
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Verify Your Email, ${organization}!</h2>
        <p style="color: #555;">Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 24px 0;">
            <a href="http://localhost:8000/api/business/verify-email?token=${token}" 
               style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
                Verify Email
            </a>
        </div>

        <div style="margin-top: 32px; padding: 16px; background-color: #f4f4f4; border-radius: 8px; border-left: 4px solid #4F46E5;">
            <p style="color: #333; font-weight: bold; margin: 0 0 8px 0;">
                📌 Add this link to your website so your customers can reach us directly for support:
            </p>
            <p style="word-break: break-all; color: #4F46E5; margin: 0;">
                ${config.FRONTEND_URL}/customer/chat-with-ai/${registeredBusiness._id}
            </p>
        </div>
    </div>`
).catch(e => console.error("Email error:", e.message))
        res.status(201).json({
            message: "Business registered successfully. We are processing your website data.",
            user: {
                id: registeredBusiness._id,
                organization: registeredBusiness.organization,
                email: registeredBusiness.businessEmail,
                role: 'business'
            }
        })

        // run ONCE in background after response is sent

    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ message: error.message })
        }
    }
}

export const verifyEmail = async (req,res) => {
    try {
        const {token} = req.query
        const decoded = jwt.verify(token, config.JWT_SECRET)
        const userId = decoded.businessId

        const business = await businessModel.findOne({_id:userId})
        if(!business) return res.status(403).json({message:"business with this token doesn't exist"})
            business.isVerified = true
            await business.save()
            if(business.isVerified){
                return res.redirect("http://localhost:5173/login")
            }
    } catch (error) {
        res.status(400).json({message:error.message})
    }   
}

export const businessLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingBusiness = await businessModel.findOne({ businessEmail: email }).select("+businessPassword");

    if (!existingBusiness)
      return res
        .status(404)
        .json({ message: "Business with that email doesn't exist" });

    const comparedPassword = await bcrypt.compare(
      password,
      existingBusiness.businessPassword,
    );
    if (!comparedPassword)
      return res.status(401).json({ message: "Invalid credentials" });
    if(!existingBusiness.isVerified) return res.status(403).json({message:"business not verified"})

        const token = jwt.sign({ businessId: existingBusiness._id }, config.JWT_SECRET, { expiresIn: '7d' })
        res.cookie("businessToken", token, {
            httpOnly: true,
            secure: config.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.status(200).json({
          message: "Business loggedIn successfully",
          user: {
            id: existingBusiness._id,
            organization: existingBusiness.organization,
            email: existingBusiness.businessEmail,
          }
        })
  } catch (error) {
    res.status(400).json({message:error.message})
  }
};


export const businessCheck = async (req,res) => {
  try {
    console.log("COOKIES:", req.cookies);
    console.log("DECODED:", req.business);

    const business = await businessModel.findOne({
      _id: req.business.businessId
    }).select("-businessPassword");

    console.log("FOUND BUSINESS:", business);

    if(!business) return res.status(404).json({message:"Business not found"});

    res.status(200).json({business});       
  } catch (error) {
    res.status(500).json({message:error.message});
  }
}

export const inviteAgents = async (req, res) => {
    try {
        const businessId = req.business.businessId
        const { agentEmail, agentName } = req.body  // ✅ frontend se email aur name lo

        const business = await businessModel.findOne({ _id: businessId })
        if (!business) return res.status(400).json({ message: 'Bad request' })

        const code = generateInviteCode()

        await sendEmail(
            agentEmail,
            `You're Invited to Join ${business.organization} as an Agent`,
            `Dear ${agentName}, you are invited to join ${business.organization}. Your secret code is: ${code}. Register at: ${config.FRONTEND_URL}/agent/register`,
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9fafb;">
                <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1e293b; margin-bottom: 8px;">You're Invited! 🎉</h2>
                    <p style="color: #64748b;">Dear <strong>${agentName}</strong>,</p>
                    <p style="color: #64748b;">We would like to invite you to join <strong>${business.organization}</strong> as an Agent.</p>
                    <p style="color: #64748b;">Your role will involve collecting data through our provided form. To get started, please use the details below:</p>
                    
                    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                        <p style="margin: 0 0 8px 0; color: #1e293b;">🔐 <strong>Secret Code:</strong></p>
                        <h1 style="letter-spacing: 8px; color: #4f46e5; margin: 0;">${code}</h1>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <p style="color: #64748b; margin-bottom: 12px;">🔗 <strong>Registration Link:</strong></p>
                        <a href="${config.FRONTEND_URL}/register" 
                           style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Complete Registration
                        </a>
                    </div>

                    <p style="color: #64748b;">Kindly complete your registration as soon as possible.</p>
                    <p style="color: #64748b;">If you face any issues, feel free to reach out.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                    <p style="color: #94a3b8; font-size: 12px;">Best regards,<br><strong>${business.organization}</strong></p>
                </div>
            </div>`
        )

        business.inviteCode = code
        await business.save()

        res.status(200).json({ message: 'Invitation sent successfully' })

    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

export const logoutBusiness = (req, res) => {
  res.clearCookie('businessToken', {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
  });
  return res.status(200).json({ message: 'Business logged out successfully' });
};


export const getInfoAboutBusiness = async (req,res) =>{
  try {
    const {businessId} = req.params
    const data = await knowledgeChunkModel.findOne({businessId})
    res.status(200).json({textData:data.text})
  } catch (error) {
    res.status(500).json({message:error.message})
  }
}

export const getAllBusinesses = async (req, res) => {
  try {
    const businesses = await businessModel.find({ isVerified: true })
      .select('_id organization')
    console.log('ALL BUSINESSES:', businesses)  // ← yeh add karo
    res.status(200).json({ businesses })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}