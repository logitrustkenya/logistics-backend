import { NextApiRequest, NextApiResponse } from "next"
import rateLimit from "express-rate-limit"
import cors from "cors"

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests, please try again later"},
})

import { APP_URL, NODE_ENV, REQUIRE_API_KEY, API_KEY } from '../utils/constants';

const corsOptions = {
    origin: APP_URL || "http://localhost:3000",
    methods: ["POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
}

export function protectRoute(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        // Enforce HTTPS
        if(NODE_ENV === "production" && !req.headers["x-forwarded-proto"]?.includes("html")){
            return res.status(403).json({message: "HTTPS required"})
        }
        // Apply CORS
        cors(corsOptions)(req as any, res as any, () => {})
        // Check API key
        const apiKey = req.headers["x-api-key"]
        if(REQUIRE_API_KEY === "true" && apiKey !== API_KEY) {
            return res.status(401).json({message: "Invalid or missing API key"})
        }

        await new Promise<void>((resolve, reject) => {
            limiter(req as any, res as any, (err: any) => {
                if(err){
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
        try {
            await handler(req, res)
        } catch(error) {
            res.status(500).json({message: "Internal server error"})
        }
    }
}
