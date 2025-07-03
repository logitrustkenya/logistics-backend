import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { json, urlencoded } from 'body-parser'

import apiRoutes from './lib/routes/apiRoutes'

const app = express();

// Middleware
app.use(helmet());

// fix allowed origins for CORS
// This allows requests from specific origins, including localhost and production URL
const allowedOrigins = [
    'http://localhost:3000',
    'https://logistics-enhanced.vercel.app'
];

if (process.env.APP_URL) {
    allowedOrigins.push(process.env.APP_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
