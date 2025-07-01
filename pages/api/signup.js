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
const email_1 = require("../../lib/utils/email");
const crypto_1 = __importDefault(require("crypto"));
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.method !== "POST") {
            return res.status(405).json({ message: "Method not allowed" });
        }
        const data = req.body;
        logger_1.default.info(`Signup attempt: ${data.email} - ${data.userType}`);
        const errors = (0, validation_1.validateSignupData)(data);
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }
        try {
            const userExists = yield (0, user_1.checkUserExists)(data.email);
            if (userExists) {
                return res.status(400).json({ message: "Email already registered" });
            }
            // Generate verification token
            const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
            yield (0, user_1.createUser)(Object.assign(Object.assign({}, data), { verificationToken }));
            // Send verification email
            yield (0, email_1.sendVerificationEmail)(data.email, verificationToken);
            return res.status(201).json({ message: "User created successfully. Please check your email to verify your account." });
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
