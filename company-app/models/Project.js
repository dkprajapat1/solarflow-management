import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      ref: 'Application',
      unique: true,
      index: true,
    },
    projectStage: {
      type: String,
      enum: [
        'ADVANCE_PAYMENT_PENDING',
        'ADVANCE_PAYMENT_RECEIVED',
        'INSTALLATION_SCHEDULED',
        'INSTALLATION_STARTED',
        'INSTALLATION_COMPLETED',
        'INSPECTION_PENDING',
        'INSPECTION_COMPLETED',
        'SUBSIDY_APPLICATION_SUBMITTED',
        'SUBSIDY_PROCESSING',
        'SUBSIDY_CREDITED',
        'PROJECT_COMPLETED',
      ],
      default: 'ADVANCE_PAYMENT_PENDING',
      index: true,
    },
    paymentDetails: {
      advanceRequired: { type: Number, default: 0 },
      advanceReceived: { type: Boolean, default: false },
      advanceReceivedAmount: { type: Number, default: 0 },
      advanceReceivedDate: { type: Date },
      finalPaid: { type: Boolean, default: false },
      finalAmount: { type: Number, default: 0 },
      finalPaidDate: { type: Date },
    },
    installationDetails: {
      installerTeam: { type: String, default: 'SolarFlow Certified Installers' },
      scheduledDate: { type: Date },
      startedAt: { type: Date },
      completedAt: { type: Date },
      remarks: { type: String, default: '' },
    },
    inspectionDetails: {
      inspectorName: { type: String, default: 'DISCOM Certified Inspector' },
      scheduledDate: { type: Date },
      inspectionPassed: { type: Boolean, default: false },
      inspectionDate: { type: Date },
      discomRemarks: { type: String, default: '' },
    },
    subsidyDetails: {
      portalRefNumber: { type: String, default: '' },
      applicationDate: { type: Date },
      disbursedAmount: { type: Number, default: 0 },
      disbursedDate: { type: Date },
      remarks: { type: String, default: '' },
    },
    stageRemarks: {
      type: String,
      default: '',
    },
    stageHistory: [
      {
        fromStage: String,
        toStage: String,
        remarks: String,
        updatedBy: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
