import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    personalDetails: {
      fullName: { type: String, required: true },
      mobile: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    propertyDetails: {
      ownership: {
        type: String,
        enum: ['Owner', 'Tenant'],
        default: 'Owner',
        required: true,
      },
      propertyType: {
        type: String,
        enum: ['Residential', 'Commercial'],
        default: 'Residential',
        required: true,
      },
      roofType: {
        type: String,
        enum: ['RCC', 'Metal', 'Other'],
        default: 'RCC',
        required: true,
      },
      availableRoofArea: {
        type: Number,
        required: true,
      },
    },
    electricityDetails: {
      consumerNumber: { type: String, required: true },
      tariffCategory: { type: String, required: true },
      sanctionedLoad: { type: Number, required: true },
      averageMonthlyUnits: { type: Number, required: true },
      monthlyBill: { type: Number, required: true },
    },
    billUpload: {
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      fileSize: { type: Number },
      documentHash: { type: String, default: '' },
      uploadedAt: { type: Date, default: Date.now },
    },
    ocrData: {
      rawText: { type: String, default: '' },
      consumerNumber: { type: String, default: null },
      tariffCategory: { type: String, default: null },
      sanctionedLoad: { type: Number, default: null },
      monthlyUnits: { type: Number, default: null },
      billAmount: { type: Number, default: null },
      confidence: { type: Number, default: 0 },
      processedAt: { type: Date },
    },
    verificationStatus: {
      status: {
        type: String,
        enum: ['VERIFIED', 'MISMATCH_DETECTED', 'MANUAL_OVERRIDE', 'PENDING'],
        default: 'PENDING',
      },
      isMatched: { type: Boolean, default: false },
      mismatchedFields: [
        {
          field: String,
          enteredValue: mongoose.Schema.Types.Mixed,
          extractedValue: mongoose.Schema.Types.Mixed,
          status: String,
        },
      ],
      notes: { type: String, default: '' },
    },
    preliminaryEstimate: {
      recommendedCapacity: { type: Number, required: true },
      yearlyGeneration: { type: Number, required: true },
      installationCost: { type: Number, required: true },
      subsidyAmount: { type: Number, required: true },
      netInstallationCost: { type: Number, required: true },
      yearlySavings: { type: Number, required: true },
      paybackPeriod: { type: Number, required: true },
      assumptions: {
        generationPerKwYear: { type: Number, default: 1400 },
        electricityTariffPerUnit: { type: Number, default: 7.5 },
        baseCostPerKw: { type: Number, default: 60000 },
      },
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'BILL_VERIFIED',
        'COMPANY_REVIEW',
        'SITE_SURVEY',
        'FINAL_QUOTATION',
        'CUSTOMER_APPROVAL',
        'ADVANCE_PAYMENT',
        'INSTALLATION_STARTED',
        'INSTALLATION_COMPLETED',
        'SUBSIDY_PROCESSING',
        'SUBSIDY_CREDITED',
        'INFO_REQUESTED',
        'REJECTED',
      ],
      default: 'SUBMITTED',
      index: true,
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    companyRemarks: {
      type: String,
      default: 'Application received. Pending initial company review.',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    statusHistory: [
      {
        stage: String,
        title: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: String, default: 'System' },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Application ||
  mongoose.model('Application', ApplicationSchema);
