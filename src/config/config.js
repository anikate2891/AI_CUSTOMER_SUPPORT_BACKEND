import dotenv from 'dotenv';
dotenv.config();

if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not defined.");
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined.");
if (!process.env.GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is not defined.");
if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("GOOGLE_CLIENT_SECRET is not defined.");
if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not defined.");
if (!process.env.FRONTEND_URL) throw new Error("FRONTEND_URL is not defined.");
if (!process.env.BACKEND_URL) throw new Error("BACKEND_URL is not defined.");

export const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_EMAIL_CLIENT_ID: process.env.GOOGLE_EMAIL_CLIENT_ID,
    GOOGLE_EMAIL_CLIENT_SECRET: process.env.GOOGLE_EMAIL_CLIENT_SECRET,
    GOOGLE_EMAIL_ACCESS_TOKEN: process.env.GOOGLE_EMAIL_ACCESS_TOKEN,
    GOOGLE_EMAIL_USER: process.env.GOOGLE_EMAIL_USER,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    NODE_ENV: process.env.NODE_ENV || "development",  // ✅ fixed
    FRONTEND_URL: process.env.FRONTEND_URL,            // ✅ duplicate hata
    BACKEND_URL: process.env.BACKEND_URL,              // ✅ naya add
};