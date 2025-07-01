const { MongoClient } = require("mongodb");

let client = null;
let db = null;

// MongoDB Atlas connection string format:
// mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://eugenekarewa223:kZ5jJFiVWnc8BlmJ@cluster0.svgf4.mongodb.net/logitrust-enhanced?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = process.env.DB_NAME || "logitrust-enhanced";

async function connectToMongoDB() {
  if (client && db) {
    return { client, db };
  }

  try {
    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    db = client.db(DB_NAME);
    
    console.log("Connected to MongoDB Atlas");
    return { client, db };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

async function closeMongoDBConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB connection closed");
  }
}

// Get database instance
async function getDB() {
  if (!db) {
    await connectToMongoDB();
  }
  return db;
}

module.exports = {
  connectToMongoDB,
  closeMongoDBConnection,
  getDB
};