"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_KEY = exports.REQUIRE_API_KEY = exports.NODE_ENV = exports.APP_URL = exports.MONGODB_URI = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.MONGODB_URI = process.env.MONGODB_URI || '';
exports.APP_URL = process.env.APP_URL || 'http://localhost:3000';
exports.NODE_ENV = process.env.NODE_ENV || 'development';
exports.REQUIRE_API_KEY = process.env.REQUIRE_API_KEY || 'false';
exports.API_KEY = process.env.API_KEY || '';
