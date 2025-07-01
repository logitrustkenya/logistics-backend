import session from 'express-session'
import MongoStore from 'mongodb'
import env from '../config/env'
import { connectToMongoDB } from '../mongodb/connect'

const clientPromise = connectToMongoDB();

const sessionConfig: session.SessionOptions = {
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: env.NODE_ENV === 'production',
        maxAge: env.SESSION_COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: 'strict',
    },
};

export default sessionConfig;
