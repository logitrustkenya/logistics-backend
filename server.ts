import http from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import app from './app'
import logger from './lib/utils/logger'
import dotenv from "dotenv"
import { connectToMongoDB, getDatabase } from './lib/mongodb/connect'

dotenv.config();

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "https://logisticske.vercel.app"
];

if (process.env.APP_URL) {
  allowedOrigins.push(process.env.APP_URL);
}

const io = new SocketIOServer(server, {
   cors: {
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  allowedHeaders: ["Authorization", "Content-Type"],
  credentials: true
}
});

interface ChatMessage {
    room: string;
    senderId: string;
    senderType: string;
    message: string;
    timestamp: Date;
}

// Connect to MongoDB on startup
async function initializeServer() {
    try {
        await connectToMongoDB();
        logger.info('MongoDB connected successfully');
        
        server.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('joinRoom', (room: string) => {
        if (!room || typeof room !== 'string') {
            socket.emit('error', { message: 'Invalid room name' });
            return;
        }
        
        socket.join(room);
        logger.info(`Socket ${socket.id} joined room ${room}`);
        
        // Notify others in the room
        socket.to(room).emit('userJoined', { 
            socketId: socket.id, 
            timestamp: new Date() 
        });
    });

    socket.on('leaveRoom', (room: string) => {
        if (!room || typeof room !== 'string') {
            socket.emit('error', { message: 'Invalid room name' });
            return;
        }
        
        socket.leave(room);
        logger.info(`Socket ${socket.id} left room ${room}`);
        
        // Notify others in the room
        socket.to(room).emit('userLeft', { 
            socketId: socket.id, 
            timestamp: new Date() 
        });
    });

    socket.on('sendMessage', async (data: {
        room: string, 
        senderId: string, 
        senderType: string, 
        message: string
    }) => {
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

            const db = await getDatabase();
            const chatCollection = db.collection('chats');

            const chatMessage: ChatMessage = {
                room: data.room,
                senderId: data.senderId,
                senderType: data.senderType,
                message: sanitizedMessage,
                timestamp: new Date()
            };

            // Save to database
            const result = await chatCollection.insertOne(chatMessage);
            
            // Add the MongoDB _id to the message for client reference
            const messageWithId = {
                ...chatMessage,
                _id: result.insertedId
            };

            // Emit to all clients in the room
            io.to(data.room).emit('newMessage', messageWithId);
            
            logger.info(`Message sent in room ${data.room} by ${data.senderId}`);

        } catch (error) {
            logger.error('Error sending message:', error);
            socket.emit('error', { 
                message: 'Failed to send message. Please try again.' 
            });
        }
    });

    // Handle getting chat history
    socket.on('getChatHistory', async (data: { room: string, limit?: number, skip?: number }) => {
        try {
            if (!data.room) {
                socket.emit('error', { message: 'Room name is required' });
                return;
            }

            const db = await getDatabase();
            const chatCollection = db.collection('chats');

            const limit = Math.min(data.limit || 50, 100); // Max 100 messages
            const skip = data.skip || 0;

            const messages = await chatCollection
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

        } catch (error) {
            logger.error('Error fetching chat history:', error);
            socket.emit('error', { 
                message: 'Failed to fetch chat history' 
            });
        }
    });

    // Handle typing indicators
    socket.on('typing', (data: { room: string, senderId: string, isTyping: boolean }) => {
        if (!data.room || !data.senderId) return;
        
        socket.to(data.room).emit('userTyping', {
            senderId: data.senderId,
            isTyping: data.isTyping
        });
    });

    socket.on('disconnect', (reason) => {
        logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Initialize the server
initializeServer();