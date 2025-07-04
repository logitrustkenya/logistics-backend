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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const logger_1 = __importDefault(require("./lib/utils/logger"));
const dotenv_1 = __importDefault(require("dotenv"));
const connect_1 = require("./lib/mongodb/connect");
dotenv_1.default.config();
const PORT = process.env.PORT || 8080;
const server = http_1.default.createServer(app_1.default);
const allowedOrigins = [
    "http://localhost:3000",
    "https://logisticske.vercel.app"
];
if (process.env.APP_URL) {
    allowedOrigins.push(process.env.APP_URL);
}
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization", "Content-Type"],
        credentials: true
    }
});
// Connect to MongoDB on startup
function initializeServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, connect_1.connectToMongoDB)();
            logger_1.default.info('MongoDB connected successfully');
            server.listen(PORT, () => {
                logger_1.default.info(`Server is running on port ${PORT}`);
                logger_1.default.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            });
        }
        catch (error) {
            logger_1.default.error('Failed to connect to MongoDB:', error);
            process.exit(1);
        }
    });
}
// Socket.IO connection handling
io.on('connection', (socket) => {
    logger_1.default.info(`Socket connected: ${socket.id}`);
    socket.on('joinRoom', (room) => {
        if (!room || typeof room !== 'string') {
            socket.emit('error', { message: 'Invalid room name' });
            return;
        }
        socket.join(room);
        logger_1.default.info(`Socket ${socket.id} joined room ${room}`);
        // Notify others in the room
        socket.to(room).emit('userJoined', {
            socketId: socket.id,
            timestamp: new Date()
        });
    });
    socket.on('leaveRoom', (room) => {
        if (!room || typeof room !== 'string') {
            socket.emit('error', { message: 'Invalid room name' });
            return;
        }
        socket.leave(room);
        logger_1.default.info(`Socket ${socket.id} left room ${room}`);
        // Notify others in the room
        socket.to(room).emit('userLeft', {
            socketId: socket.id,
            timestamp: new Date()
        });
    });
    socket.on('sendMessage', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Validate input data
            if (!data.room || !data.senderId || !data.message) {
                socket.emit('error', { message: 'Missing required fields' });
                return;
            }
            // Sanitize message (basic XSS prevention)
            const sanitizedMessage = data.message.trim();
            if (sanitizedMessage.length === 0) {
                socket.emit('error', { message: 'Message cannot be empty' });
                return;
            }
            if (sanitizedMessage.length > 1000) {
                socket.emit('error', { message: 'Message too long (max 1000 characters)' });
                return;
            }
            const db = yield (0, connect_1.getDatabase)();
            const chatCollection = db.collection('chats');
            const chatMessage = {
                room: data.room,
                senderId: data.senderId,
                senderType: data.senderType,
                message: sanitizedMessage,
                timestamp: new Date()
            };
            // Save to database
            const result = yield chatCollection.insertOne(chatMessage);
            // Add the MongoDB _id to the message for client reference
            const messageWithId = Object.assign(Object.assign({}, chatMessage), { _id: result.insertedId });
            // Emit to all clients in the room
            io.to(data.room).emit('newMessage', messageWithId);
            logger_1.default.info(`Message sent in room ${data.room} by ${data.senderId}`);
        }
        catch (error) {
            logger_1.default.error('Error sending message:', error);
            socket.emit('error', {
                message: 'Failed to send message. Please try again.'
            });
        }
    }));
    // Handle getting chat history
    socket.on('getChatHistory', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!data.room) {
                socket.emit('error', { message: 'Room name is required' });
                return;
            }
            const db = yield (0, connect_1.getDatabase)();
            const chatCollection = db.collection('chats');
            const limit = Math.min(data.limit || 50, 100); // Max 100 messages
            const skip = data.skip || 0;
            const messages = yield chatCollection
                .find({ room: data.room })
                .sort({ timestamp: -1 })
                .limit(limit)
                .skip(skip)
                .toArray();
            // Reverse to get chronological order
            const chronologicalMessages = messages.reverse();
            socket.emit('chatHistory', {
                room: data.room,
                messages: chronologicalMessages,
                hasMore: messages.length === limit
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching chat history:', error);
            socket.emit('error', {
                message: 'Failed to fetch chat history'
            });
        }
    }));
    // Handle typing indicators
    socket.on('typing', (data) => {
        if (!data.room || !data.senderId)
            return;
        socket.to(data.room).emit('userTyping', {
            senderId: data.senderId,
            isTyping: data.isTyping
        });
    });
    socket.on('disconnect', (reason) => {
        logger_1.default.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
    // Handle connection errors
    socket.on('error', (error) => {
        logger_1.default.error(`Socket error for ${socket.id}:`, error);
    });
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger_1.default.info('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger_1.default.info('Process terminated');
        process.exit(0);
    });
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Initialize the server
initializeServer();
