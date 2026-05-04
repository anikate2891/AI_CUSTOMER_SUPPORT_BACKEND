import { config } from "../config/config.js";
import agentModel from "../models/agents.model.js";
import sendAgentTokenResponse from "../utils/generate-agent-code.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import businessModel from "../models/business.model.js";
import ticketModel from "../models/ticket.model.js";
import sendEmail from "../config/sendEmail.config.js";

export const agentRegister = async (req, res) => {
  try {
    const { agentFullName, agentEmail, agentPassword, invitationCode } =
      req.body;

      const business = await businessModel.findOne({inviteCode:invitationCode})
    if(!business) return res.status(409).json({message:'invalid invititation code'})
    const existingUser = await agentModel.findOne({ agentEmail });
    if (existingUser)
      return res
        .status(409)
        .json({ message: "User with that email already exists" });

    const agent = await agentModel.create({
      agentFullName,
      agentEmail,
      agentPassword,
      businessId:business._id
    });

    const token = jwt.sign(
      { id: agent._id },
      config.JWT_SECRET,
    );

    

    await sendEmail(
      agentEmail,
      `Verify Your SupportAI Agent Account`,
      `Hi ${agentFullName}, please verify your email using this link: http://localhost:8000/api/agent/verify-email?token=${token}`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333;">Verify Your Email, ${agentFullName}!</h2>
    <p style="color: #555;">
      You have been registered as a support agent on SupportAI. Please verify your email address to activate your account.
    </p>

    <div style="text-align: center; margin: 24px 0;">
        <a href="http://localhost:8000/api/agent/verify-email?token=${token}" 
           style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Verify Email
        </a>
    </div>

    <p style="color: #777; font-size: 14px;">
      If the button above doesn't work, copy and paste this link into your browser:
    </p>

    <p style="word-break: break-all; color: #4F46E5;">
      http://localhost:8000/api/agent/verify-email?token=${token}
    </p>

    <p style="color: #999; font-size: 12px; margin-top: 20px;">
      If you did not request this, your invite code may have been used without your knowledge. Please contact your organization admin.
    </p>
</div>`,
    );

    return sendAgentTokenResponse(agent, res);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const agentVerifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const agent = await agentModel.findOne({_id:decoded.id})
    if(!agent) return res.status(404).json({message:"invalid token"})
        agent.isVerified = true
        await agent.save()
        res.redirect('http://localhost:5173/login')
  } catch (error) { res.status(500).json({message:error.message})}
};

export const agentLogin = async (req, res) => {
  try {
    const { agentEmail, agentPassword } = req.body;

    // 🔴 Check input
    if (!agentEmail || !agentPassword) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 🔴 Find agent
    const agent = await agentModel.findOne({ agentEmail });

    if (!agent) {
      return res.status(404).json({
        message: "User with that email doesnt exist",
      });
    }

    // 🔥 DEBUG (remove in production)
    console.log("AGENT FOUND:", agentEmail);
    console.log("IS VERIFIED:", agent.isVerified);

    // 🔴 Password check (safe)
    const comparedPassword = await bcrypt.compare(
      agentPassword,
      agent.agentPassword
    );

    console.log("PASSWORD MATCH:", comparedPassword);

    if (!comparedPassword) {
      return res.status(401).json({
        message: "Invalid credentials (wrong password)",
      });
    }

    // 🔴 Email verification check
    if (!agent.isVerified) {
      return res.status(401).json({
        message: "Agent is not verified. Please verify your email first.",
      });
    }

    // 🔥 SUCCESS LOGIN
    return sendAgentTokenResponse(agent, res);

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const agentCheck = async (req,res) =>{
  try {
    const agent = await agentModel.findOne({_id:req.agent.agentId}).select('-password')
    res.status(200).json({agent})
  } catch (error) {
    res.status(500).json({message:error.message})
  }
}

export const getTickets = async (req, res) => {
    try {
        const agentId = req.agent.agentId
        const agent = await agentModel.findOne({_id: agentId})
        const business = await businessModel.findOne({_id: agent.businessId})

        const tickets = await ticketModel.find({
            businessId: business._id, 
            status: { $in: ['open', 'in-progress', 'resolved'] }
        })
        .populate('assignedAgentId', 'agentFullName')
        .populate('userId', 'fullname')

        res.status(200).json({tickets})

    } catch (error) {
        console.log('ERROR:', error.message)  // ✅ add karo
        res.status(500).json({message:error.message})
    }
}

export const logoutAgent = (req, res) => {
  res.clearCookie('agentToken', {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
  });
  return res.status(200).json({ message: 'Agent logged out successfully' });
};

export const getAllAgents = async (req, res) => {
  try {
    const businessId = req.business.businessId
    const agents = await agentModel.find({ businessId })
      .select('agentFullName agentEmail isVerified createdAt')
    res.status(200).json({ agents })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
