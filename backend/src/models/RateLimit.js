import mongoose from 'mongoose';

const rateLimitSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true, default: 0, min: 0 },
    expireAt: { type: Date, required: true }
  },
  { versionKey: false, timestamps: false }
);

// MongoDB's TTL monitor removes expired counters. Logical window keys also keep
// stale counters from being used before the monitor runs.
rateLimitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit = mongoose.model('RateLimit', rateLimitSchema);
