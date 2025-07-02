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
exports.rateCourier = rateCourier;
const connect_1 = require("../mongodb/connect");
const logger_1 = __importDefault(require("../utils/logger"));
const mongodb_1 = require("mongodb");
function rateCourier(req, res) {
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
            const courierRatings = yield ratingsCollection.find({ courierId }).toArray();
            const avgRating = courierRatings.reduce((acc, cur) => acc + cur.rating, 0) / courierRatings.length;
            const usersCollection = db.collection('users');
            yield usersCollection.updateOne({ _id: new mongodb_1.ObjectId(courierId) }, { $set: { averageRating: avgRating } });
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
