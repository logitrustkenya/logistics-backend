import request from 'supertest';
import express from 'express';
import router from '../lib/routes/apiRoutes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let app: express.Express;
let mongoServer: MongoMemoryServer;
let client: MongoClient;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  client = new MongoClient(uri);
  await client.connect();

  // Mock getDatabase to use in-memory MongoDB
  jest.mock('../lib/mongodb/connect', () => ({
    getDatabase: () => client.db('testdb'),
  }));

  app = express();
  app.use(express.json());
  app.use('/api', router);
});

afterAll(async () => {
  await client.close();
  await mongoServer.stop();
});

describe('API Routes', () => {
  test('GET /api/verify should return 200', async () => {
    const res = await request(app).get('/api/verify');
    expect(res.statusCode).toBe(200);
  });

  test('POST /api/signup should handle signup', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ email: 'test@example.com', password: 'password123' });
    expect([200, 400, 409]).toContain(res.statusCode);
  });

  test('POST /api/login with email should handle login', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'password123', authMethod: 'email' });
    expect([200, 400, 401]).toContain(res.statusCode);
  });

  test('POST /api/login with google token should handle login', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ googleCredential: 'fake-token', authMethod: 'google' });
    expect([200, 401]).toContain(res.statusCode);
  });

  test('GET /api/auth/google/login should redirect to Google OAuth', async () => {
    const res = await request(app).get('/api/auth/google/login');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toMatch(/^https:\/\/accounts\.google\.com/);
  });

  test('GET /api/auth/google/callback without code should return 400', async () => {
    const res = await request(app).get('/api/auth/google/callback');
    expect(res.statusCode).toBe(400);
  });

  // Additional tests for callback with invalid code can be added here
});
