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
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const apiRoutes_1 = __importDefault(require("../lib/routes/apiRoutes"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongodb_1 = require("mongodb");
let app;
let mongoServer;
let client;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new mongodb_1.MongoClient(uri);
    yield client.connect();
    // Mock getDatabase to use in-memory MongoDB
    jest.mock('../lib/mongodb/connect', () => ({
        getDatabase: () => client.db('testdb'),
    }));
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/api', apiRoutes_1.default);
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    yield client.close();
    yield mongoServer.stop();
}));
describe('API Routes', () => {
    test('GET /api/verify should return 200', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).get('/api/verify');
        expect(res.statusCode).toBe(200);
    }));
    test('POST /api/signup should handle signup', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/api/signup')
            .send({ email: 'test@example.com', password: 'password123' });
        expect([200, 400, 409]).toContain(res.statusCode);
    }));
    test('POST /api/login with email should handle login', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/api/login')
            .send({ email: 'test@example.com', password: 'password123', authMethod: 'email' });
        expect([200, 400, 401]).toContain(res.statusCode);
    }));
    test('POST /api/login with google token should handle login', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app)
            .post('/api/login')
            .send({ googleCredential: 'fake-token', authMethod: 'google' });
        expect([200, 401]).toContain(res.statusCode);
    }));
    test('GET /api/auth/google/login should redirect to Google OAuth', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).get('/api/auth/google/login');
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toMatch(/^https:\/\/accounts\.google\.com/);
    }));
    test('GET /api/auth/google/callback without code should return 400', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(app).get('/api/auth/google/callback');
        expect(res.statusCode).toBe(400);
    }));
    // Additional tests for callback with invalid code can be added here
});
