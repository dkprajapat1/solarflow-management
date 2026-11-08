import mongoose from 'mongoose';

const SurveySchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      ref: 'Application',
      index: true,
    },
    surveyorName: {
      type: String,
      default: 'Technical Field Surveyor',
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTimeSlot: {
      type: String,
      default: '10:00 AM - 01:00 PM',
    },
    assignedStaff: {
      type: String,
      default: 'Operations Field Team',
    },
    visitStatus: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    rescheduleReason: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    actualRoofArea: {
      type: Number,
      default: 0,
    },
    usableRoofArea: {
      type: Number,
      default: 0,
    },
    roofCondition: {
      type: String,
      enum: ['Excellent', 'Good', 'Needs Minor Repair', 'Unsuitable'],
      default: 'Good',
    },
    shadowFreeArea: {
      type: Number,
      default: 0,
    },
    installationFeasibility: {
      type: String,
      enum: [
        'Highly Feasible',
        'Feasible with Structure Elevation',
        'Feasible with Tree Trimming',
        'Not Recommended',
      ],
      default: 'Highly Feasible',
    },
    recommendedSystemCapacity: {
      type: Number,
      default: 0,
    },
    surveyRemarks: {
      type: String,
      default: '',
    },
    surveyObservations: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Survey || mongoose.model('Survey', SurveySchema);
