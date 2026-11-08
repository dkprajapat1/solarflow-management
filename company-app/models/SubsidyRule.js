import mongoose from 'mongoose';

const SubsidyRuleSchema = new mongoose.Schema(
  {
    schemeName: {
      type: String,
      required: true,
      default: 'PM Surya Ghar: Muft Bijli Yojana',
    },
    slabs: [
      {
        minKw: { type: Number, required: true },
        maxKw: { type: Number, required: true },
        subsidyAmount: { type: Number, required: true },
        description: { type: String },
      },
    ],
    maxSubsidyAmount: { type: Number, default: 78000 },
    maximumEligibleCapacityKw: { type: Number, default: 10 },
    effectiveFrom: { type: Date, default: () => new Date('2024-01-01') },
    effectiveUntil: { type: Date, default: () => new Date('2030-12-31') },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.SubsidyRule ||
  mongoose.model('SubsidyRule', SubsidyRuleSchema);
