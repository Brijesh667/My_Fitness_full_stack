#!/usr/bin/env node
import 'dotenv/config';
import mongoose from 'mongoose';

const LEGACY_INDEXES = [
  { collection: 'users', index: 'emailId_1' },
  { collection: 'weeklyplans', index: 'userId_1' }
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;

  for (const { collection, index } of LEGACY_INDEXES) {
    try {
      const indexes = await db.collection(collection).indexes();
      if (!indexes.some((entry) => entry.name === index)) {
        console.log(`${collection}.${index}: not present`);
        continue;
      }
      await db.collection(collection).dropIndex(index);
      console.log(`${collection}.${index}: dropped`);
    } catch (error) {
      if (error.code === 26 || error.codeName === 'NamespaceNotFound') {
        console.log(`${collection}: collection not present`);
        continue;
      }
      throw error;
    }
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`drop-legacy-indexes failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
