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
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization"],
        credentials: true
    }
});
io.on('connection', (socket) => {
    logger_1.default.info(`Socket connected: ${socket.id}`);
    socket.on('joinRoom', (room) => {
        socket.join(room);
        logger_1.default.info(`Socket ${socket.id} joined room ${room}`);
    });
    socket.on('leaveRoom', (room) => {
        socket.leave(room);
        logger_1.default.info(`Socket ${socket.id} left room ${room}`);
    });
    socket.on('sendMessage', (data) => __awaiter(void 0, void 0, void 0, function* () {
        const db = yield (0, connect_1.getDatabase)();
        const chatCollection = db.collection('chats');
        const chatMessage = {
            room: data.room,
            senderId: data.senderId,
            senderType: data.senderType,
            message: data.message,
            timestamp: new Date()
        };
        yield chatCollection.insertOne(chatMessage);
        io.to(data.room).emit('newMessage', chatMessage);
    }));
    socket.on('disconnect', () => {
        logger_1.default.info(`Socket disconnected: ${socket.id}`);
    });
});
server.listen(PORT, () => {
    logger_1.default.info(`Server is running on port ${PORT}`);
});
