import dotenv from 'dotenv';

dotenv.config();

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://eugenekarewa223:kZ5jJFiVWnc8BlmJ@cluster0.svgf4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
export const APP_URL = process.env.APP_URL || 'https://logistics-enhanced-app.vercel.app/';
export const NODE_ENV = process.env.NODE_ENV || 'production';
export const REQUIRE_API_KEY = process.env.REQUIRE_API_KEY || 'false';
export const API_KEY = process.env.API_KEY || '';
