import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db.js';
import PricingRule from '@/models/PricingRule.js';
import SubsidyRule from '@/models/SubsidyRule.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const pricing = await PricingRule.findOne({ isActive: true }).lean();
    const subsidy = await SubsidyRule.findOne({ isActive: true }).lean();

    return NextResponse.json({
      success: true,
      pricing: pricing || {
        name: 'Default Pricing Rule',
        panelRatePerKw: 32000,
        inverterRatePerKw: 12000,
        structureRatePerKw: 6000,
        installationRatePerKw: 5000,
        electricalsRatePerKw: 5000,
      },
      subsidy: subsidy || {
        schemeName: 'PM Surya Ghar: Muft Bijli Yojana',
        slabs: [
          { minKw: 0, maxKw: 1, subsidyAmount: 30000 },
          { minKw: 1, maxKw: 2, subsidyAmount: 60000 },
          { minKw: 2, maxKw: 10, subsidyAmount: 78000 },
        ],
        maxSubsidyAmount: 78000,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { pricing, subsidy } = await request.json();
    await connectToDatabase();

    if (pricing) {
      await PricingRule.findOneAndUpdate(
        { isActive: true },
        { ...pricing, isActive: true },
        { upsert: true, new: true }
      );
    }

    if (subsidy) {
      await SubsidyRule.findOneAndUpdate(
        { isActive: true },
        { ...subsidy, isActive: true },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing and subsidy settings updated successfully.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
