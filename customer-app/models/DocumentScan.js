import mongoose from 'mongoose';

const DocumentScanSchema = new mongoose.Schema(
  {
    documentHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PROCESSING',
      index: true,
    },
    rawText: {
      type: String,
      default: '',
    },
    verificationResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    geminiCallCount: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DocumentScan ||
  mongoose.model('DocumentScan', DocumentScanSchema);
