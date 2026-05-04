import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { config } from './config/config.js';
import connectDB from './db/mongoDB.js';

import authRouter from './routes/auth.route.js';
import businessRouter from './routes/business.routes.js';
import ticketRouter from './routes/ticket.routes.js';
import agentRouter from './routes/agent.routes.js';
// import { config } from './config/config.js';

const app = express();

// 1. Logger for debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// 2. Extremely permissive CORS for development
app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins in dev
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 200 // Some older browsers choke on 204
}));

// 3. Parsers
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// 4. Database
connectDB();

// 5. Passport / Auth
app.use(passport.initialize());
passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: `${config.BACKEND_URL}/api/auth/google/callback`  // ← yahi change karo
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

console.log("CALLBACK URL:", `${config.BACKEND_URL}/api/auth/google/callback`);     
console.log("BACKEND_URL:", config.BACKEND_URL);

// 6. Routes
app.use('/api/auth', authRouter);   
app.use('/api/business', businessRouter);
app.use('/api/tickets', ticketRouter);
app.use("/api/agent", agentRouter);

export default app;
