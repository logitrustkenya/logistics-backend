import { Request, Response } from 'express';
import { checkUserExists, createUser } from '../services/user';
import { validateSignupData } from '../utils/validation';
import logger from '../utils/logger';
import { sendVerificationEmail } from '../utils/email';
import crypto from 'crypto';
import { closeMongoDBConnection } from '../mongodb/connect';

export async function signup(req: Request, res: Response) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    const data = req.body;
    logger.info(`Signup attempt: ${data.email} - ${data.userType}`);

    const errors = validateSignupData(data);
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
    }
    try {
        const userExists = await checkUserExists(data.email);
        if (userExists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        await createUser({ ...data, verificationToken });
        // await sendVerificationEmail(data.email, verificationToken);
        return res.status(201).json({ message: 'User created successfully,,,,congrats real. Please check your email to verify your account.' });
    } catch (error) {
        // logger.error('Signup error', error);
        return res.status(500).json({ message: 'try again later' });
    } finally {
        await closeMongoDBConnection();
    }
}

 
