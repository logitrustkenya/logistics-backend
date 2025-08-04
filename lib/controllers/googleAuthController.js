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
exports.googleCallback = exports.googleLogin = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connect_1 = require("../mongodb/connect");
const logger_1 = __importDefault(require("../utils/logger"));
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRATION = '1h';
const googleLogin = (req, res) => {
    const scope = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    res.redirect(authUrl);
};
exports.googleLogin = googleLogin;
const googleCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('Authorization code not provided');
    }
    try {
        // Exchange code for tokens
        const tokenResponse = yield (0, node_fetch_1.default)('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });
        const tokenData = (yield tokenResponse.json());
        if (!tokenResponse.ok) {
            logger_1.default.error('Failed to exchange code for tokens', tokenData);
            return res.status(500).send('Failed to exchange code for tokens');
        }
        const idToken = tokenData.id_token;
        // Verify ID token
        const decoded = jsonwebtoken_1.default.decode(idToken);
        if (!decoded) {
            return res.status(401).send('Invalid ID token');
        }
        const { email, name, picture, sub: googleId, email_verified } = decoded;
        // Upsert user in database
        const db = yield (0, connect_1.getDatabase)();
        const usersCollection = db.collection('users');
        let user = yield usersCollection.findOne({ $or: [{ email }, { googleId }] });
        if (!user) {
            // Create new user
            const newUser = {
                email,
                name,
                profilePicture: picture,
                googleId,
                emailVerified: email_verified,
                createdAt: new Date(),
                lastLogin: new Date(),
                userType: 'user',
            };
            const result = yield usersCollection.insertOne(newUser);
            user = Object.assign(Object.assign({}, newUser), { _id: result.insertedId });
        }
        else {
            // Update existing user
            yield usersCollection.updateOne({ _id: user._id }, { $set: { lastLogin: new Date(), profilePicture: picture, emailVerified: email_verified, googleId } });
        }
        // Issue JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user._id,
            email: user.email,
            userType: user.userType,
        }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
        // Redirect or respond with token
        // For example, redirect to frontend with token as query param (adjust as needed)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login-success?token=${token}`);
    }
    catch (error) {
        logger_1.default.error('Google OAuth callback error', error);
        res.status(500).send('Internal Server Error');
    }
});
exports.googleCallback = googleCallback;
