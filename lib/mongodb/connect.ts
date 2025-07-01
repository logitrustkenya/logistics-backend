import { MongoClient, MongoClientOptions } from 'mongodb';
import { MONGODB_URI } from '../utils/constants';

if(!MONGODB_URI){
    console.error('MONGODB_URI environment variable is not set or empty');
    throw new Error('MONGODB_URI environment variable is not set');
}

const options: MongoClientOptions = {
    retryWrites: true,
    w: "majority",
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 5000,
}

const client = new MongoClient(MONGODB_URI, options)

let isConnected = false

function maskUri(uri: string): string {
    try {
        const url = new URL(uri);
        if (url.password) {
            url.password = '****';
        }
        return url.toString();
    } catch {
        return 'Invalid URI';
    }
}

export async function connectToMongoDB(){
    if(!isConnected){
        console.log(`Attempting to connect to MongoDB with URI: ${maskUri(MONGODB_URI)}`);
        try{
            await client.connect()
            isConnected = true
            console.log("Successfully connected to MongoDB Atlas")
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
        console.log("MongoDB Atlas connection closed")
    }
}
