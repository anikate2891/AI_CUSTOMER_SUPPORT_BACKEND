import { getIo } from '../socketio/socketio.js'
import ticketModel from '../models/ticket.model.js';
import mongoose from 'mongoose'    

const generateTicketNumber = () => {
    return 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase()
}

export const getAdminStats = async (req, res) => {
    try {
        const businessId = new mongoose.Types.ObjectId(req.business.businessId)
        
        console.log('businessId:', businessId)
        
        const sample = await ticketModel.findOne()
        console.log('SAMPLE businessId:', sample?.businessId)
        console.log('MATCH TEST:', sample?.businessId?.equals(businessId))

        const totalTickets = await ticketModel.countDocuments({ businessId })
        console.log('TOTAL:', totalTickets)
        const openTickets = await ticketModel.countDocuments({ businessId, status: 'open' })
        const inProgressTickets = await ticketModel.countDocuments({ businessId, status: 'in-progress' })
        const resolvedTickets = await ticketModel.countDocuments({ businessId, status: 'resolved' })

        const last7Days = []
        for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const start = new Date(date.setHours(0, 0, 0, 0))
            const end = new Date(date.setHours(23, 59, 59, 999))

            const incoming = await ticketModel.countDocuments({ businessId, createdAt: { $gte: start, $lte: end } })
            const resolved = await ticketModel.countDocuments({ businessId, status: 'resolved', updatedAt: { $gte: start, $lte: end } })

            last7Days.push({
                day: start.toLocaleDateString('en-US', { weekday: 'short' }),
                total: incoming,
                resolved,
            })
        }

        res.status(200).json({ totalTickets, openTickets, inProgressTickets, resolvedTickets, last7Days })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const createTicket = async (req, res) => {
    
    try {
        const userId = req.user.id
        const { title, description, businessId } = req.body

        console.log('REQ BODY:', req.body)        // ← yeh lagao
        console.log('USER:', req.user)             // ← yeh lagao
        console.log('BUSINESS ID:', businessId)    // ← yeh lagao

        const ticketNumber = generateTicketNumber()

        const ticket = await ticketModel.create({
            title,
            description,
            status: 'open',
            businessId,
            userId,
            assignedAgentId: null,
            ticketNumber,
        })

        const io = getIo()
        io.to(businessId.toString()).emit('new:ticket', ticket)

        res.status(201).json({ message: 'Ticket created successfully', ticket })

    } catch (error) {
        console.log('ERROR:', error.message)   // ← yeh lagao
        res.status(500).json({ message: error.message })
    }
}

export const getAllTickets = async (req, res) => {
    try {
        const tickets = await ticketModel.find({ userId: req.user.id })
        res.status(200).json({ tickets })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteTicket = async (req, res) => {
    try {
        const { ticketid } = req.params
        const deletedTicket = await ticketModel.findOneAndDelete({ _id: ticketid })
        res.status(200).json({ message: 'ticket deleted successfully', deletedTicket })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteAll = async (req, res) => {
    try {
        const { userId } = req.params
        const tickets = await ticketModel.deleteMany({ userId })
        res.status(200).json({ message: 'All tickets deleted', tickets })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const acceptTicket = async (req, res) => {
    try {
        const { ticketid } = req.params

        const ticket = await ticketModel.findOneAndUpdate(
            { _id: ticketid },
            {
                assignedAgentId: req.agent.agentId,  // ✅ id → agentId
                status: 'in-progress'
            },
            { new: true }
        )

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' })
        }

        res.status(200).json({ message: 'ticket accepted', ticket })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}


export const resolveTicket = async (req, res) => {
    try {
        const { ticketid } = req.params
        const ticket = await ticketModel.findOneAndUpdate(
            { _id: ticketid },
            { status: 'resolved' },
            { new: true }
        )
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
        res.status(200).json({ message: 'Ticket resolved', ticket })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}