import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db.js';
import Application from '@/models/Application.js';
import Survey from '@/models/Survey.js';
import Quotation from '@/models/Quotation.js';
import Project from '@/models/Project.js';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    await connectToDatabase();

    const application = await Application.findOne({
      $or: [{ applicationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

    if (!application) {
      return NextResponse.json(
        { error: 'Application lead not found' },
        { status: 404 }
      );
    }

    const survey = await Survey.findOne({ applicationId: application.applicationId }).lean();
    const quotation = await Quotation.findOne({ applicationId: application.applicationId }).lean();
    const project = await Project.findOne({ applicationId: application.applicationId }).lean();

    return NextResponse.json({
      success: true,
      application,
      survey,
      quotation,
      project,
    });
  } catch (error) {
    console.error('Fetch lead error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve lead data' },
      { status: 500 }
    );
  }
}
