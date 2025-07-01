"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Method not allowed' });
        }
        const { userId, courierId, rating, comment } = req.body;
        if (!userId || !courierId || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Invalid input data' });
        }
        try {
            const db = yield (0, connect_1.getDatabase)();
            const ratingsCollection = db.collection('courierRatings');
            const ratingDoc = {
                userId,
                courierId,
                rating,
                comment: comment || '',
                createdAt: new Date(),
            };
            yield ratingsCollection.insertOne(ratingDoc);
            // Optionally, update courier's average rating
            const courierRatings = yield ratingsCollection.find({ courierId }).toArray();
            const avgRating = courierRatings.reduce((acc, cur) => acc + cur.rating, 0) / courierRatings.length;
            const usersCollection = db.collection('users');
            const { ObjectId } = yield Promise.resolve().then(() => __importStar(require('mongodb')));
            yield usersCollection.updateOne({ _id: new ObjectId(courierId) }, { $set: { averageRating: avgRating } });
            return res.status(201).json({ message: 'Rating submitted successfully', averageRating: avgRating });
        }
        catch (error) {
            logger_1.default.error('Error submitting courier rating', error);
            return res.status(500).json({ message: 'Server error, please try again later' });
        }
        finally {
            yield (0, connect_1.closeMongoDBConnection)();
        }
    });
}
exports.default = handler;
