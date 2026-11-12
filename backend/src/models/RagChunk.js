import mongoose from 'mongoose';

const ragChunkSchema = new mongoose.Schema(
  {
    sourceName: { type: String, required: true, trim: true, maxlength: 200 },
    sourceDoc: { type: String, required: true, trim: true, maxlength: 300 },
    page: { type: Number, min: 1 },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true, validate: (v) => v.length > 0 },
    tokenCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

ragChunkSchema.index({ sourceName: 1 });

export const RagChunk = mongoose.model('RagChunk', ragChunkSchema);
