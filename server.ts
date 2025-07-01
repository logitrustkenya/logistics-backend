import http from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import app from './app'
import logger from './lib/utils/logger'
import dotenv from "dotenv"
import { connectToMongoDB, getDatabase } from './lib/mongodb/connect'

dotenv.config();

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization"],
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

io.on('connection', (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('joinRoom', (room: string) => {
        socket.join(room);
        logger.info(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('leaveRoom', (room: string) => {
        socket.leave(room);
        logger.info(`Socket ${socket.id} left room ${room}`);
    });

    socket.on('sendMessage', async (data: {room: string, senderId: string, senderType: string, message: string}) => {
        const db = await getDatabase();
        const chatCollection = db.collection('chats');

        const chatMessage: ChatMessage = {
            room: data.room,
            senderId: data.senderId,
            senderType: data.senderType,
            message: data.message,
            timestamp: new Date()
        };

        await chatCollection.insertOne(chatMessage);

        io.to(data.room).emit('newMessage', chatMessage);
    });

    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
