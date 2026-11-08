import mongoose from 'mongoose';

const PricingRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    panelRatePerKw: { type: Number, required: true, default: 32000 },
    inverterRatePerKw: { type: Number, required: true, default: 12000 },
    structureRatePerKw: { type: Number, required: true, default: 6000 },
    installationRatePerKw: { type: Number, required: true, default: 5000 },
    electricalsRatePerKw: { type: Number, required: true, default: 5000 },
    marginPercentage: { type: Number, default: 10 },
    effectiveFrom: { type: Date, default: Date.now },
    effectiveUntil: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.PricingRule ||
  mongoose.model('PricingRule', PricingRuleSchema);
