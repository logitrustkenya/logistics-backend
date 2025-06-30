import { MongoClient, MongoClientOptions } from 'mongodb';
import dotenv from 'dotenv';

const uri = process.env.MONGODB_URI;
if(!uri){
    throw new Error('MONGODB_URI enviroment varible is not set')
}

const options: MongoClientOptions = {
    retryWrites: true,
    w: "majority",
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 5000,
}

const client = new MongoClient(uri, options)

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