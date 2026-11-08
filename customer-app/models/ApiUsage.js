import mongoose from 'mongoose';

const ApiUsageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    lastCalledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const ApiUsage =
  mongoose.models.ApiUsage || mongoose.model('ApiUsage', ApiUsageSchema);

export default ApiUsage;

/**
 * Increment the persistent Gemini API call counter and return the updated total
 */
export async function incrementGeminiCallCount() {
  const record = await ApiUsage.findOneAndUpdate(
    { name: 'gemini_api_calls' },
    { $inc: { count: 1 }, $set: { lastCalledAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return record.count;
}

/**
 * Get current persistent Gemini API call count
 */
export async function getGeminiCallCount() {
  const record = await ApiUsage.findOne({ name: 'gemini_api_calls' });
  return record ? record.count : 0;
}
