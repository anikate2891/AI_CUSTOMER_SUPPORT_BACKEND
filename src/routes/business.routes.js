import express from 'express'
import { businessRegisterValidator } from '../validators/auth.validator.js'
import { businessLogin, businessRegister, inviteAgents, verifyEmail, logoutBusiness, getAllBusinesses, getInfoAboutBusiness, businessCheck } from '../controllers/business.controllers.js'
import { authenticateBusiness } from '../middlewares/business.middleware.js'

const businessRouter = express.Router()

businessRouter.post('/register', businessRegisterValidator,  businessRegister)
businessRouter.get('/verify-email', verifyEmail)
businessRouter.post('/login', businessLogin)
businessRouter.post('/invite-agent', authenticateBusiness, inviteAgents)
businessRouter.post('/logout', logoutBusiness)
businessRouter.get('/get-business-info/:businessId', authenticateBusiness, getInfoAboutBusiness)
businessRouter.get('/business-check', authenticateBusiness, businessCheck)
businessRouter.get('/all-businesses', getAllBusinesses)

export default businessRouter