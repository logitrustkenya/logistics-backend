import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { getDatabase } from '../mongodb/connect';
import logger from '../utils/logger';

export async function login(req: Request, res: Response) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    const data = req.body;
    logger.info(`Login attempt: ${data.email}`);

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return res.status(400).json({ errors: { email: 'Valid email is required' } });
    }
    if (!data.password || data.password.length < 8) {
        return res.status(400).json({ errors: { password: 'Password must be at least 8 characters long' } });
    }

    try {
        const db = await getDatabase();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ email: data.email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(data.password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        return res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        logger.error('Login error', error);
        return res.status(500).json({ message: 'Server error, please try again later' });
    }
}
