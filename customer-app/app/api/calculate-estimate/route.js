import { NextResponse } from 'next/server';
import { calculatePreliminaryEstimate } from '@/lib/solarCalculations.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { monthlyUnits, monthlyBill, roofArea, customCapacity } = body;

    const estimate = calculatePreliminaryEstimate({
      monthlyUnits: Number(monthlyUnits) || 300,
      monthlyBill: Number(monthlyBill) || 2250,
      roofArea: Number(roofArea) || 500,
      customCapacity: customCapacity ? Number(customCapacity) : null,
    });

    return NextResponse.json({
      success: true,
      estimate,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Calculation failed' },
      { status: 400 }
    );
  }
}
