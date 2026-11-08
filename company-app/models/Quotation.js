import mongoose from 'mongoose';

const QuotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    applicationId: {
      type: String,
      required: true,
      ref: 'Application',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    systemDetails: {
      capacityKw: { type: Number, required: true },
      panelModel: { type: String, default: 'Mono PERC Bifacial 550W Tier-1 (DCR)' },
      panelCount: { type: Number, default: 6 },
      inverterModel: { type: String, default: 'Grid-Tied String Inverter (Wi-Fi Enabled)' },
      warrantyYears: { type: Number, default: 25 },
    },
    pricingBreakdown: {
      solarPanels: { type: Number, required: true },
      inverter: { type: Number, required: true },
      mountingStructure: { type: Number, required: true },
      cablingAndElectricals: { type: Number, required: true },
      installationAndCommissioning: { type: Number, required: true },
      netMeteringAndLiaisoning: { type: Number, default: 5000 },
      grossTotal: { type: Number, required: true },
      taxes: { type: Number, default: 0 },
    },
    subsidy: {
      centralSubsidy: { type: Number, default: 0 },
      stateSubsidy: { type: Number, default: 0 },
      totalSubsidy: { type: Number, required: true },
    },
    netCustomerCost: {
      type: Number,
      required: true,
    },
    metrics: {
      annualGenerationUnits: { type: Number, required: true },
      estimatedAnnualSavings: { type: Number, required: true },
      estimatedPaybackYears: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent to customer', 'Approved', 'Rejected', 'Revised'],
      default: 'Sent to customer',
      index: true,
    },
    revisionNotes: {
      type: String,
      default: '',
    },
    validUntil: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Quotation ||
  mongoose.model('Quotation', QuotationSchema);
