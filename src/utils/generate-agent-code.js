import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'

const sendAgentTokenResponse = (agent, res) => {
    const token = jwt.sign(
        { agentId: agent._id },
        config.JWT_SECRET,
        { expiresIn: '7d' }
    )

    res.cookie('agentToken', token, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    // ✅ YE ADD KARO
    return res.status(200).json({
        message: 'Login successful',
        agent: {
            id: agent._id,
            name: agent.agentFullName,
            email: agent.agentEmail,
            businessId: agent.businessId,
            role: 'agent'
        }
    })
}

export default sendAgentTokenResponse