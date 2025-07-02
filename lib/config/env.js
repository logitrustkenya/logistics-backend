"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("../utils/logger"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url(),
    RESEND_API_KEY: zod_1.z.string().min(1),
    RESEND_FROM_EMAIL: zod_1.z.string().email(),
    SESSION_SECRET: zod_1.z.string().min(32),
    NODE_ENV: zod_1.z.enum(['development', 'production']).default('development'),
    SESSION_COOKIE_MAX_AGE: zod_1.z.string().regex(/^\\d+$/).transform(Number),
    PORT: zod_1.z.string().regex(/^\\d+$/).transform(Number).default('3000'),
});
const env = envSchema.safeParse(process.env);
if (!env.success) {
    logger_1.default.error('Environment variable validation failed:', env.error);
    process.exit(1);
}
exports.default = env.data;
