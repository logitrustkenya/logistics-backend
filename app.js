"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = require("body-parser");
const apiRoutes_1 = __importDefault(require("./lib/routes/apiRoutes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
// fix allowed origins for CORS
// This allows requests from specific origins, including localhost and production URL
const allowedOrigins = [
    'http://localhost:3000',
    'https://logistics-enhanced.vercel.app'
];
if (process.env.APP_URL) {
    allowedOrigins.push(process.env.APP_URL);
}
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error(`Origin not allowed by CORS: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, morgan_1.default)('dev'));
app.use((0, body_parser_1.json)());
app.use((0, body_parser_1.urlencoded)({ extended: true }));
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
app.use('/api', apiRoutes_1.default);
exports.default = app;
