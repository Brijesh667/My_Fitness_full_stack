import { beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/myfitness-test';
process.env.JWT_SECRET = 'test_jwt_secret_at_least_thirty_two_characters';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.COOKIE_SECURE = 'false';
process.env.CLOUDINARY_MOCK = 'true';
process.env.RAG_MOCK = 'true';
process.env.APP_TIMEZONE = 'Asia/Kolkata';
process.env.ASSISTANT_DAILY_LIMIT = '5';
process.env.LOGIN_PAIR_LIMIT = '1000';
process.env.LOGIN_IP_LIMIT = '1000';
process.env.SIGNUP_IP_LIMIT = '1000';
process.env.GLOBAL_IP_LIMIT = '10000';
process.env.TRUST_PROXY_HOPS = '1';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 120000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}, 120000);
