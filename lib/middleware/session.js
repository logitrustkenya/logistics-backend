"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("../config/env"));
const connect_1 = require("../mongodb/connect");
const clientPromise = (0, connect_1.connectToMongoDB)();
const sessionConfig = {
    secret: env_1.default.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: env_1.default.NODE_ENV === 'production',
        maxAge: env_1.default.SESSION_COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: 'strict',
    },
};
exports.default = sessionConfig;
