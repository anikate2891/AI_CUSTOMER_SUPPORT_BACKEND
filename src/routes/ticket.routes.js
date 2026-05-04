import express from 'express'
import { acceptTicket, createTicket, deleteTicket, deleteAll, getAllTickets } from '../controllers/ticket.controller.js'
import { authenticateUser } from '../middlewares/auth.middleware.js'
import { authenticateAgent } from '../middlewares/agent.middleware.js'
import { authenticateBusiness } from '../middlewares/business.middleware.js'
import { getAdminStats } from '../controllers/ticket.controller.js'
const ticketRouter = express.Router()

ticketRouter.post('/create-ticket', authenticateUser, createTicket)
ticketRouter.delete('/delete-ticket/:ticketid', authenticateUser,  deleteTicket)
ticketRouter.delete('/delete-ticket/:userId', authenticateUser, deleteAll)
ticketRouter.patch('/accept-ticket/:ticketid', authenticateAgent, acceptTicket)
ticketRouter.get('/all-tickets', authenticateUser, getAllTickets)
ticketRouter.get('/admin-stats', authenticateBusiness, getAdminStats)

export default ticketRouter