"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
const bcrypt_1 = __importDefault(require("bcrypt"));
const connect_1 = require("../mongodb/connect");
const logger_1 = __importDefault(require("../utils/logger"));
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Method not allowed' });
        }
        const data = req.body;
        logger_1.default.info(`Login attempt: ${data.email}`);
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            return res.status(400).json({ errors: { email: 'Valid email is required' } });
        }
        if (!data.password || data.password.length < 8) {
            return res.status(400).json({ errors: { password: 'Password must be at least 8 characters long' } });
        }
        try {
            const db = yield (0, connect_1.getDatabase)();
            const usersCollection = db.collection('users');
            const user = yield usersCollection.findOne({ email: data.email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            const passwordMatch = yield bcrypt_1.default.compare(data.password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            return res.status(200).json({ message: 'Login successful' });
        }
        catch (error) {
            logger_1.default.error('Login error', error);
            return res.status(500).json({ message: 'Server error, please try again later' });
        }
    });
}
