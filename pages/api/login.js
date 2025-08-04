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
const connect_1 = require("../../lib/mongodb/connect");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../../lib/utils/logger"));
const cors_1 = __importDefault(require("../../lib/middleware/cors"));
const JWT_SECRET = process.env.JWT_SECRET || 'ca0e70b4a83f9477Qazxdfe45e6f62678bv-lhu-b1a3344zxxcffga933b85b967274d93c6c3c61a5b784ea1f5a5e1';
const JWT_EXPIRATION = '1h';
function validateEmailLoginData(data) {
    const errors = {};
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Valid email is required';
    }
    if (!data.password || data.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
    }
    return errors;
}
function verifyGoogleToken(credential) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Decode the JWT without verification to get payload
            const decoded = jsonwebtoken_1.default.decode(credential);
            if (!decoded) {
                throw new Error('Invalid Google token');
            }
            // Verify with Google's endpoint
            const response = yield fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
            const tokenInfo = yield response.json();
            if (!response.ok) {
                throw new Error('Failed to verify Google token');
            }
            return {
                email: tokenInfo.email,
                name: tokenInfo.name,
                picture: tokenInfo.picture,
                googleId: tokenInfo.sub,
                emailVerified: tokenInfo.email_verified
            };
        }
        catch (error) {
            logger_1.default.error('Google token verification failed', error);
            throw new Error('Invalid Google token');
        }
    });
}
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, cors_1.default)(req, res);
        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Method not allowed' });
        }
        const data = req.body;
        logger_1.default.info(`Login attempt: ${data.authMethod === 'google' ? 'Google OAuth' : data.email}`);
        try {
            const db = yield (0, connect_1.getDatabase)();
            const usersCollection = db.collection('users');
            let user = null;
            if (data.authMethod === 'google' && data.googleCredential) {
                // Handle Google OAuth login
                try {
                    const googleUser = yield verifyGoogleToken(data.googleCredential);
                    // Find user by email or Google ID
                    user = yield usersCollection.findOne({
                        $or: [
                            { email: googleUser.email },
                            { googleId: googleUser.googleId }
                        ]
                    });
                    if (!user) {
                        return res.status(401).json({
                            message: 'Account not found. Please sign up first.',
                            requireSignup: true
                        });
                    }
                    // Update user with Google info if not already set
                    if (!user.googleId) {
                        yield usersCollection.updateOne({ _id: user._id }, {
                            $set: {
                                googleId: googleUser.googleId,
                                profilePicture: googleUser.picture,
                                emailVerified: true,
                                lastLogin: new Date()
                            }
                        });
                    }
                    else {
                        // Update last login
                        yield usersCollection.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
                    }
                    logger_1.default.info(`Google login successful: ${googleUser.email}`);
                }
                catch (googleError) {
                    logger_1.default.error('Google authentication failed', googleError);
                    return res.status(401).json({ message: 'Google authentication failed' });
                }
            }
            else {
                // Handle traditional email/password login
                const errors = validateEmailLoginData(data);
                if (Object.keys(errors).length > 0) {
                    return res.status(400).json({ errors });
                }
                user = yield usersCollection.findOne({ email: data.email });
                if (!user) {
                    return res.status(401).json({ message: 'Email not found' });
                }
                if (!user.password) {
                    return res.status(401).json({
                        message: 'This account uses Google sign-in. Please use Google to log in.'
                    });
                }
                const passwordMatch = yield bcrypt_1.default.compare(data.password, user.password);
                if (!passwordMatch) {
                    return res.status(401).json({ message: 'Incorrect password, Try again' });
                }
                // Update last login
                yield usersCollection.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
            }
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({
                userId: user._id,
                email: user.email,
                userType: user.userType
            }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
            return res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    userType: user.userType,
                    userId: user._id,
                    email: user.email,
                    name: user.firstName ? `${user.firstName} ${user.lastName}` : user.name,
                    profilePicture: user.profilePicture,
                    emailVerified: user.emailVerified || false
                }
            });
        }
        catch (error) {
            logger_1.default.error('Login error', error);
            console.error('Login API error:', error);
            return res.status(500).json({ message: 'Server error, please try again later' });
        }
    });
}
exports.default = handler;
