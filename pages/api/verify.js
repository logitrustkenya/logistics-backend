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
const logger_1 = __importDefault(require("../../lib/utils/logger"));
const cors_1 = __importDefault(require("../../lib/middleware/cors"));
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, cors_1.default)(req, res);
        if (req.method !== "GET") {
            return res.status(405).json({ message: "Method not allowed" });
        }
        const { token } = req.query;
        if (!token || typeof token !== "string") {
            return res.status(400).json({ message: "Invalid verification token" });
        }
        try {
            const db = yield (0, connect_1.getDatabase)();
            const usersCollection = db.collection("users");
            const user = yield usersCollection.findOneAndUpdate({ verificationToken: token }, { $set: { isVerified: true }, $unset: { verificationToken: "" } }, { returnDocument: "after" });
            if (!user || !user.value) {
                return res.status(400).json({ message: "Invalid or expired verification token" });
            }
            return res.status(200).json({ message: "Verified successfully" });
        }
        catch (error) {
            logger_1.default.error("Verified error", error);
            return res.status(500).json({ message: "Server error, please try again later" });
        }
    });
}
exports.default = handler;
