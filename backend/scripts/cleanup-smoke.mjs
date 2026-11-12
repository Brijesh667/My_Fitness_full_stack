#!/usr/bin/env node
import 'dotenv/config';
import mongoose from 'mongoose';

const emailPattern = /^smoke\+.*@example\.test$/i;

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({ email: emailPattern }).toArray();
  let deleted = 0;

  for (const user of users) {
    const counts = await Promise.all([
      db.collection('weeklyplans').deleteMany({ user: user._id }),
      db.collection('workoutsessions').deleteMany({ user: user._id }),
      db.collection('dietplans').deleteMany({ user: user._id }),
      db.collection('dietlogs').deleteMany({ user: user._id }),
      db.collection('exercises').deleteMany({ owner: user._id }),
      db.collection('ratelimits').deleteMany({
        $or: [
          { _id: { $regex: `^assistant:${user._id}:` } },
          { _id: { $regex: user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } }
        ]
      })
    ]);
    deleted += counts.reduce((sum, item) => sum + item.deletedCount, 0);
    await db.collection('users').deleteOne({ _id: user._id });
  }

  console.log(`cleanup-smoke: users=${users.length}, related documents=${deleted}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`cleanup-smoke failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
