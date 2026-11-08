import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db.js';
import Application from '@/models/Application.js';
import { ensureDemoCustomer } from '@/lib/auth.js';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    await connectToDatabase();
    await ensureDemoCustomer();

    const application = await Application.findOne({
      $or: [{ applicationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error('Fetch application by id error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application details' },
      { status: 500 }
    );
  }
}
