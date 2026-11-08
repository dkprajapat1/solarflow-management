import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db.js';
import Application from '@/models/Application.js';
import User from '@/models/User.js';
import { generateApplicationId } from '@/lib/idGenerator.js';
import { calculatePreliminaryEstimate } from '@/lib/solarCalculations.js';
import { getCurrentUser, ensureDemoCustomer } from '@/lib/auth.js';

export async function GET(request) {
  try {
    await connectToDatabase();
    let user = await getCurrentUser();

    if (!user) {
      user = await ensureDemoCustomer();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const applications = await Application.find({ customerId: user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      applications,
      count: applications.length,
    });
  } catch (error) {
    console.error('Fetch applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDatabase();
    let user = await getCurrentUser();

    if (!user) {
      user = await ensureDemoCustomer();
    }

    const body = await request.json();
    const {
      personalDetails,
      propertyDetails,
      electricityDetails,
      billUpload,
      ocrData,
      verificationStatus,
    } = body;

    if (!personalDetails || !propertyDetails || !electricityDetails) {
      return NextResponse.json(
        { error: 'Missing required sections of the solar application' },
        { status: 400 }
      );
    }

    const estimate = calculatePreliminaryEstimate({
      monthlyUnits: Number(electricityDetails.averageMonthlyUnits),
      monthlyBill: Number(electricityDetails.monthlyBill),
      roofArea: Number(propertyDetails.availableRoofArea),
    });

    const newAppId = generateApplicationId();

    let priority = 'Medium';
    if (
      electricityDetails.monthlyBill >= 5000 ||
      propertyDetails.availableRoofArea >= 1000
    ) {
      priority = 'High';
    } else if (
      electricityDetails.monthlyBill < 1500 &&
      propertyDetails.availableRoofArea < 300
    ) {
      priority = 'Low';
    }

    const application = await Application.create({
      applicationId: newAppId,
      customerId: user._id,
      personalDetails,
      propertyDetails,
      electricityDetails,
      billUpload: billUpload || {
        fileName: 'electricity_bill.jpg',
        fileSize: 450000,
        fileType: 'image/jpeg',
      },
      ocrData: ocrData || {
        rawText: '',
        confidence: 85,
      },
      verificationStatus: verificationStatus || {
        status: 'VERIFIED',
        isMatched: true,
        mismatchedFields: [],
        notes: 'Verified via OCR matching',
      },
      preliminaryEstimate: estimate,
      status: 'SUBMITTED',
      priority,
      companyRemarks:
        'Application successfully received. Our engineering team is reviewing your roof specs and bill details.',
      statusHistory: [
        {
          stage: 'SUBMITTED',
          title: 'Application Submitted',
          timestamp: new Date(),
          updatedBy: user.name,
          notes: 'Customer submitted initial solar rooftop application online.',
        },
      ],
    });

    return NextResponse.json({
      success: true,
      applicationId: application.applicationId,
      application,
      message: 'Solar application submitted successfully!',
    });
  } catch (error) {
    console.error('Submit application error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    );
  }
}
