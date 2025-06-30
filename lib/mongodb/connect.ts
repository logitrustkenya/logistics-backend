import { MongoClient, MongoClientOptions } from 'mongodb';
import { MONGODB_URI } from '../utils/constants';

if(!MONGODB_URI){
    throw new Error('MONGODB_URI environment variable is not set')
}

const options: MongoClientOptions = {
    retryWrites: true,
    w: "majority",
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 5000,
}

const client = new MongoClient(MONGODB_URI, options)

let isConnected = false

export async function connectToMongoDB(){
    if(!isConnected){
        try{
            await client.connect()
            isConnected = true
            console.log("Connect")
        } catch(error) {
            console.error("Failed to connect to MongoDB Atlas:", error)
            throw new Error("Database connection failed")
        }
    }
    return client
}

export async function getDatabase() {
    const client = await connectToMongoDB()
    return client.db("Logitrust")
}

export async function closeMongoDBConnection() {
    if(isConnected){
        await client.close()
        isConnected = false
        console.log("MOngoDB Atlas connection closed")
    }
}
