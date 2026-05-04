import express from 'express'
import { agentRegister, agentLogin, getTickets, getAllAgents, agentVerifyEmail, logoutAgent, agentCheck } from '../controllers/agent.controller.js'
import { authenticateAgent } from '../middlewares/agent.middleware.js'
import { authenticateBusiness } from '../middlewares/business.middleware.js'
import { acceptTicket, resolveTicket } from '../controllers/ticket.controller.js'

const agentRouter = express.Router()

agentRouter.patch('/accept-ticket/:ticketid', authenticateAgent, acceptTicket)
agentRouter.patch('/resolve-ticket/:ticketid', authenticateAgent, resolveTicket)
agentRouter.post('/register', agentRegister)
agentRouter.get('/verify-email', agentVerifyEmail)
agentRouter.post('/login', agentLogin)
agentRouter.get('/tickets', authenticateAgent, getTickets)
agentRouter.get('/me', authenticateAgent, agentCheck)
agentRouter.post('/logout', logoutAgent)
agentRouter.get('/all-agents', authenticateBusiness, getAllAgents)

export default agentRouter