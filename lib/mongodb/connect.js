"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToMongoDB = connectToMongoDB;
exports.getDatabase = getDatabase;
exports.closeMongoDBConnection = closeMongoDBConnection;
const mongodb_1 = require("mongodb");
const constants_1 = require("../utils/constants");
if (!constants_1.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set or empty');
    throw new Error('MONGODB_URI environment variable is not set');
}
const options = {
    retryWrites: true,
    w: "majority",
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 5000,
};
const client = new mongodb_1.MongoClient(constants_1.MONGODB_URI, options);
let isConnected = false;
function maskUri(uri) {
    try {
        const url = new URL(uri);
        if (url.password) {
            url.password = '****';
        }
        return url.toString();
    }
    catch (_a) {
        return 'Invalid URI';
    }
}
function connectToMongoDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected) {
            console.log(`Attempting to connect to MongoDB with URI: ${maskUri(constants_1.MONGODB_URI)}`);
            try {
                yield client.connect();
                isConnected = true;
                console.log("Successfully connected to MongoDB Atlas");
            }
            catch (error) {
                console.error("Failed to connect to MongoDB Atlas:", error);
                throw new Error("Database connection failed");
            }
        }
        return client;
    });
}
function getDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield connectToMongoDB();
        return client.db("Logitrust");
    });
}
function closeMongoDBConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isConnected) {
            yield client.close();
            isConnected = false;
            console.log("MongoDB Atlas connection closed");
        }
    });
}
