import { Request, Response } from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../mongodb/connect';
import logger from '../utils/logger';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRATION = '1h';

export const googleLogin = (req: Request, res: Response) => {
  const scope = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(
    CLIENT_ID
  )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

  res.redirect(authUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).send('Authorization code not provided');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      logger.error('Failed to exchange code for tokens', tokenData);
      return res.status(500).send('Failed to exchange code for tokens');
    }

    const idToken = tokenData.id_token;

    // Verify ID token
    const decoded: any = jwt.decode(idToken);

    if (!decoded) {
      return res.status(401).send('Invalid ID token');
    }

    const { email, name, picture, sub: googleId, email_verified } = decoded;

    // Upsert user in database
    const db = await getDatabase();
    const usersCollection = db.collection('users');

    let user = await usersCollection.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      // Create new user
      const newUser = {
        email,
        name,
        profilePicture: picture,
        googleId,
        emailVerified: email_verified,
        createdAt: new Date(),
        lastLogin: new Date(),
        userType: 'user',
      };
      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      // Update existing user
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date(), profilePicture: picture, emailVerified: email_verified, googleId } }
      );
    }

    // Issue JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userType: user.userType,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    // Redirect or respond with token
    // For example, redirect to frontend with token as query param (adjust as needed)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login-success?token=${token}`);
  } catch (error) {
    logger.error('Google OAuth callback error', error);
    res.status(500).send('Internal Server Error');
  }
};
