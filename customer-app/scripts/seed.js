import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solarflow';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  mobile: String,
  password: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
});

const applicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, unique: true },
    customerId: mongoose.Schema.Types.ObjectId,
    personalDetails: Object,
    propertyDetails: Object,
    electricityDetails: Object,
    billUpload: Object,
    ocrData: Object,
    verificationStatus: Object,
    preliminaryEstimate: Object,
    status: String,
    priority: String,
    companyRemarks: String,
    rejectionReason: String,
    statusHistory: Array,
  },
  { timestamps: true }
);

const pricingRuleSchema = new mongoose.Schema(
  {
    name: String,
    panelRatePerKw: Number,
    inverterRatePerKw: Number,
    structureRatePerKw: Number,
    installationRatePerKw: Number,
    electricalsRatePerKw: Number,
    marginPercentage: Number,
    effectiveFrom: Date,
    effectiveUntil: Date,
    isActive: Boolean,
  },
  { timestamps: true }
);

const subsidyRuleSchema = new mongoose.Schema(
  {
    schemeName: String,
    slabs: Array,
    maxSubsidyAmount: Number,
    maximumEligibleCapacityKw: Number,
    effectiveFrom: Date,
    effectiveUntil: Date,
    isActive: Boolean,
  },
  { timestamps: true }
);

async function seed() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB successfully.');

  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
  const PricingRule = mongoose.models.PricingRule || mongoose.model('PricingRule', pricingRuleSchema);
  const SubsidyRule = mongoose.models.SubsidyRule || mongoose.model('SubsidyRule', subsidyRuleSchema);

  const customerPassword = await bcrypt.hash('Customer@123', 10);
  const salesPassword = await bcrypt.hash('Sales@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  let customer = await User.findOne({ email: 'customer@solarflow.demo' });
  if (!customer) {
    customer = await User.create({
      name: 'Rajesh Sharma',
      email: 'customer@solarflow.demo',
      mobile: '9876543210',
      password: customerPassword,
      role: 'customer',
    });
    console.log('Created Demo Customer: customer@solarflow.demo / Customer@123');
  }

  let salesUser = await User.findOne({ email: 'sales@solarflow.demo' });
  if (!salesUser) {
    salesUser = await User.create({
      name: 'Amit Verma (Sales)',
      email: 'sales@solarflow.demo',
      mobile: '9876500001',
      password: salesPassword,
      role: 'sales',
    });
    console.log('Created Demo Sales Staff: sales@solarflow.demo / Sales@123');
  }

  let adminUser = await User.findOne({ email: 'admin@solarflow.demo' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Pooja Iyer (Admin)',
      email: 'admin@solarflow.demo',
      mobile: '9876500002',
      password: adminPassword,
      role: 'admin',
    });
    console.log('Created Demo Admin: admin@solarflow.demo / Admin@123');
  }

  const existingPricing = await PricingRule.findOne({ isActive: true });
  if (!existingPricing) {
    await PricingRule.create({
      name: 'Standard Residential 2024-25',
      panelRatePerKw: 32000,
      inverterRatePerKw: 12000,
      structureRatePerKw: 6000,
      installationRatePerKw: 5000,
      electricalsRatePerKw: 5000,
      marginPercentage: 10,
      effectiveFrom: new Date('2024-01-01'),
      effectiveUntil: new Date('2026-12-31'),
      isActive: true,
    });
    console.log('Created Standard Pricing Rule');
  }

  const existingSubsidy = await SubsidyRule.findOne({ isActive: true });
  if (!existingSubsidy) {
    await SubsidyRule.create({
      schemeName: 'PM Surya Ghar: Muft Bijli Yojana',
      slabs: [
        { minKw: 0, maxKw: 1, subsidyAmount: 30000, description: '₹30,000 for 1 kW' },
        { minKw: 1, maxKw: 2, subsidyAmount: 60000, description: '₹60,000 for 2 kW' },
        { minKw: 2, maxKw: 10, subsidyAmount: 78000, description: '₹78,000 cap for 3 kW and above' },
      ],
      maxSubsidyAmount: 78000,
      maximumEligibleCapacityKw: 10,
      effectiveFrom: new Date('2024-01-01'),
      effectiveUntil: new Date('2030-12-31'),
      isActive: true,
    });
    console.log('Created PM Surya Ghar Subsidy Rule');
  }

  const existingApp = await Application.findOne({ customerId: customer._id });
  if (!existingApp) {
    await Application.create({
      applicationId: 'SF-2025-1001',
      customerId: customer._id,
      personalDetails: {
        fullName: 'Rajesh Sharma',
        mobile: '9876543210',
        email: 'customer@solarflow.demo',
        address: '42 Green Park Avenue, Flat 302',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      },
      propertyDetails: {
        ownership: 'Owner',
        propertyType: 'Residential',
        roofType: 'RCC',
        availableRoofArea: 480,
      },
      electricityDetails: {
        consumerNumber: '1008459231',
        tariffCategory: 'Residential / Domestic (LT-1)',
        sanctionedLoad: 5,
        averageMonthlyUnits: 420,
        monthlyBill: 3120,
      },
      billUpload: {
        fileName: 'MSEDCL_Oct2024_Bill.jpg',
        fileSize: 420000,
        fileType: 'image/jpeg',
      },
      ocrData: {
        confidence: 95,
        consumerNumber: '1008459231',
        tariffCategory: 'Residential / Domestic',
        sanctionedLoad: 5,
        monthlyUnits: 420,
        billAmount: 3120,
      },
      verificationStatus: {
        status: 'VERIFIED',
        isMatched: true,
        mismatchedFields: [],
        notes: 'Automated OCR verification matched customer entered data.',
      },
      preliminaryEstimate: {
        recommendedCapacity: 3.5,
        yearlyGeneration: 4900,
        installationCost: 210000,
        subsidyAmount: 78000,
        netInstallationCost: 132000,
        yearlySavings: 36750,
        paybackPeriod: 3.6,
      },
      status: 'SUBMITTED',
      priority: 'High',
      companyRemarks: 'Application submitted. Ready for engineering desk review.',
      statusHistory: [
        {
          stage: 'SUBMITTED',
          title: 'Application Submitted',
          timestamp: new Date(),
          updatedBy: 'Customer (Online)',
          notes: 'Customer submitted initial solar application with verified bill.',
        },
      ],
    });
    console.log('Created Demo Application SF-2025-1001 for customer');
  }

  console.log('Customer App database seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
