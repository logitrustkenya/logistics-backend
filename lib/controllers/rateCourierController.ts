import { Request, Response } from 'express';
import { getDatabase, closeMongoDBConnection } from '../mongodb/connect';
import logger from '../utils/logger';
import { ObjectId } from 'mongodb';

export async function rateCourier(req: Request, res: Response) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    const { userId, courierId, rating, comment } = req.body;

    if (!userId || !courierId || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Invalid input data' });
    }

    try {
        const db = await getDatabase();
        const ratingsCollection = db.collection('courierRatings');

        const ratingDoc = {
            userId,
            courierId,
            rating,
            comment: comment || '',
            createdAt: new Date(),
        };

        await ratingsCollection.insertOne(ratingDoc);

        const courierRatings = await ratingsCollection.find({ courierId }).toArray();
        const avgRating =
            courierRatings.reduce((acc, cur) => acc + cur.rating, 0) / courierRatings.length;

        const usersCollection = db.collection('users');
        await usersCollection.updateOne(
            { _id: new ObjectId(courierId) },
            { $set: { averageRating: avgRating } }
        );

        return res.status(201).json({ message: 'Rating submitted successfully', averageRating: avgRating });
    } catch (error) {
        logger.error('Error submitting courier rating', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    } finally {
        await closeMongoDBConnection();
    }
}
