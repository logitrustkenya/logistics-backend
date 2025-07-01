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
exports.sendVerificationEmail = sendVerificationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("./logger"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
function sendVerificationEmail(email, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const verificationUrl = `${process.env.APP_URL}/api/verify?token=${token}`;
        const mailOptions = {
            from: process.env.SMTP_FROM || 'no-reply@example.com',
            to: email,
            subject: 'Please verify your email address',
            text: `Thank you for signing up. Please verify your email by clicking the following link: ${verificationUrl}`,
            html: `<p>Thank you for signing up. Please verify your email by clicking the following link:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
        };
        try {
            yield transporter.sendMail(mailOptions);
            logger_1.default.info(`Verification email sent to ${email}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to send verification email to ${email}`, error);
            throw new Error('Failed to send verification email');
        }
    });
}
