import { NextApiHandler, NextApiRequest, NextApiResponse } from "next"
import { getDatabase } from "../../lib/mongodb/connect"
import { protectRoute } from "../../lib/middleware/protectRoute"
import logger from "../../lib/utils/logger"


async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method !=="GET"){
        return res.status(405).json({ message: "Method not allowed"})
    }

    const { token } = req.query
    if(!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid verification token"})
    }
    try{
        const db = await getDatabase()
        const usersCollection = db.collection("users")
        const user = await usersCollection.findOneAndUpdate(
            {verificationToken: token},
            {$set: { isVerified: true}, $unset: { verificationToken: ""}},
            {returnDocument: "after"}
        )
        if(!user || !user.value) {
            return res.status(400).json({message: "Invalid or expired verification token"})
        }
        return res.status(200).json({message: "Verified successfully"})
    } catch (error) {
        logger.error("Verified error", error)
        return res.status(500).json({message: "Server error, please try again later"})
    }
}

export default handler
