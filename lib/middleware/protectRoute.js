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
exports.protectRoute = protectRoute;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests, please try again later" },
});
const constants_1 = require("../utils/constants");
const corsOptions = {
    origin: constants_1.APP_URL || "http://localhost:3000",
    methods: ["POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
function protectRoute(handler) {
    return (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        // Enforce HTTPS
        if (constants_1.NODE_ENV === "production" && !((_a = req.headers["x-forwarded-proto"]) === null || _a === void 0 ? void 0 : _a.includes("html"))) {
            return res.status(403).json({ message: "HTTPS required" });
        }
        // Apply CORS
        (0, cors_1.default)(corsOptions)(req, res, () => { });
        // Check API key
        const apiKey = req.headers["x-api-key"];
        if (constants_1.REQUIRE_API_KEY === "true" && apiKey !== constants_1.API_KEY) {
            return res.status(401).json({ message: "Invalid or missing API key" });
        }
        yield new Promise((resolve, reject) => {
            limiter(req, res, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
        try {
            yield handler(req, res);
        }
        catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    });
}
