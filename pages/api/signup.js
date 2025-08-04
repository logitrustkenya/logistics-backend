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
const validation_1 = require("../../lib/utils/validation");
const user_1 = require("../../lib/services/user");
const logger_1 = __importDefault(require("../../lib/utils/logger"));
const connect_1 = require("../../lib/mongodb/connect");
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cors_1 = __importDefault(require("../../lib/middleware/cors"));
const JWT_SECRET = process.env.JWT_SECRET || 'ca0e70b4a83f9477Qazxdfe45e6f62678bv-lhu-b1a3344zxxcffga933b85b967274d93c6c3c61a5b784ea1f5a5e1';
function verifyGoogleToken(credential) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
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
                emailVerified: tokenInfo.email_verified,
                firstName: tokenInfo.given_name || '',
                lastName: tokenInfo.family_name || ''
            };
        }
        catch (error) {
            logger_1.default.error('Google token verification failed', error);
            throw new Error('Invalid Google token');
        }
    });
}
function createGoogleUser(userData, googleUserData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield (0, connect_1.getDatabase)();
            const usersCollection = db.collection('users');
            const newUser = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ userType: userData.userType, firstName: googleUserData.firstName, lastName: googleUserData.lastName, name: googleUserData.name, email: googleUserData.email, googleId: googleUserData.googleId, profilePicture: googleUserData.picture, emailVerified: true, authMethod: 'google', createdAt: new Date(), updatedAt: new Date() }, (userData.phoneNumber && { phoneNumber: userData.phoneNumber })), (userData.companyName && { companyName: userData.companyName })), (userData.companyType && { companyType: userData.companyType })), (userData.businessRegistration && { businessRegistration: userData.businessRegistration })), (userData.courierCompanyName && { courierCompanyName: userData.courierCompanyName })), (userData.serviceType && { serviceType: userData.serviceType })), (userData.licenseNumber && { licenseNumber: userData.licenseNumber })), (userData.experience && { experience: userData.experience })), (userData.coverage && { coverage: userData.coverage })), (userData.driverLicense && { driverLicense: userData.driverLicense })), (userData.vehicleType && { vehicleType: userData.vehicleType })), (userData.vehicleRegistration && { vehicleRegistration: userData.vehicleRegistration })), (userData.insuranceNumber && { insuranceNumber: userData.insuranceNumber }));
            const result = yield usersCollection.insertOne(newUser);
            return Object.assign(Object.assign({}, newUser), { _id: result.insertedId });
        }
        catch (error) {
            logger_1.default.error('Error creating Google user', error);
            throw error;
        }
    });
}
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, cors_1.default)(req, res);
        if (req.method !== "POST") {
            return res.status(405).json({ message: "Method not allowed" });
        }
        const data = req.body;
        logger_1.default.info(`Signup attempt: ${data.email} - ${data.userType} - ${data.authMethod || 'email'}`);
        try {
            let userData = data;
            let googleUserData = null;
            // Handle Google OAuth signup
            if (data.authMethod === 'google' && data.googleCredential) {
                try {
                    googleUserData = yield verifyGoogleToken(data.googleCredential);
                    // Check if user already exists
                    const existingUser = yield (0, user_1.checkUserExists)(googleUserData.email);
                    if (existingUser) {
                        return res.status(400).json({
                            message: "Account already exists. Please sign in instead.",
                            accountExists: true
                        });
                    }
                    // Validate required fields for Google signup
                    if (!data.userType) {
                        return res.status(400).json({
                            errors: { userType: "User type is required" }
                        });
                    }
                    // Create user with Google data
                    const newUser = yield createGoogleUser(data, googleUserData);
                    // Generate JWT token
                    const token = jsonwebtoken_1.default.sign({
                        userId: newUser._id,
                        email: newUser.email,
                        userType: newUser.userType
                    }, JWT_SECRET, { expiresIn: '1h' });
                    logger_1.default.info(`Google signup successful: ${googleUserData.email}`);
                    return res.status(201).json({
                        message: "Account created successfully with Google!",
                        success: true,
                        token,
                        user: {
                            userType: newUser.userType,
                            userId: newUser._id,
                            email: newUser.email,
                            name: newUser.name,
                            profilePicture: newUser.profilePicture,
                            emailVerified: true
                        }
                    });
                }
                catch (googleError) {
                    logger_1.default.error('Google signup error', googleError);
                    return res.status(400).json({
                        message: "Google authentication failed. Please try again."
                    });
                }
            }
            else {
                // Handle traditional email/password signup
                const errors = (0, validation_1.validateSignupData)(data);
                if (Object.keys(errors).length > 0) {
                    return res.status(400).json({ errors });
                }
                const userExists = yield (0, user_1.checkUserExists)(data.email);
                if (userExists) {
                    return res.status(400).json({ message: "Email already registered" });
                }
                // Generate verification token
                const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
                const userToCreate = Object.assign(Object.assign({}, data), { firstName: data.firstName || '', verificationToken });
                yield (0, user_1.createUser)(userToCreate);
                // Send verification email (uncomment when ready)
                // await sendVerificationEmail(data.email, verificationToken)
                return res.status(201).json({
                    message: "User created successfully! Please check your email to verify your account.",
                    success: true
                });
            }
        }
        catch (error) {
            logger_1.default.error("Signup error", error);
            return res.status(500).json({ message: "Server error, please try again later" });
        }
        finally {
            yield (0, connect_1.closeMongoDBConnection)();
        }
    });
}
exports.default = handler;
