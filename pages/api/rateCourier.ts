import type { NextApiRequest, NextApiResponse } from 'next'
import { getDatabase, closeMongoDBConnection } from '../../lib/mongodb/connect'
import logger from '../../lib/utils/logger'

interface RateCourierRequest {
    userId: string
    courierId: string
    rating: number
    comment?: string
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const { userId, courierId, rating, comment } = req.body as RateCourierRequest

    if (!userId || !courierId || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Invalid input data' })
    }

    try {
        const db = await getDatabase()
        const ratingsCollection = db.collection('courierRatings')

        const ratingDoc = {
            userId,
            courierId,
            rating,
            comment: comment || '',
            createdAt: new Date(),
        }

        await ratingsCollection.insertOne(ratingDoc)

        // Optionally, update courier's average rating
        const courierRatings = await ratingsCollection.find({ courierId }).toArray()
        const avgRating =
            courierRatings.reduce((acc, cur) => acc + cur.rating, 0) / courierRatings.length

        const usersCollection = db.collection('users')
        const { ObjectId } = await import('mongodb')
        await usersCollection.updateOne(
            { _id: new ObjectId(courierId) },
            { $set: { averageRating: avgRating } }
        )

        return res.status(201).json({ message: 'Rating submitted successfully', averageRating: avgRating })
    } catch (error) {
        logger.error('Error submitting courier rating', error)
        return res.status(500).json({ message: 'Server error, please try again later' })
    } finally {
        await closeMongoDBConnection()
    }
}

export default handler
