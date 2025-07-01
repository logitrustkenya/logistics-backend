import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { json, urlencoded } from 'body-parser'

import apiRoutes from './lib/routes/apiRoutes'

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(morgan('dev'));
app.use(json());
app.use(urlencoded({ extended: true }));

// Request logging middleware for debugging
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Use API routes
app.use('/api', apiRoutes);

export default app;
