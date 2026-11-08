import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db.js';
import Application from '@/models/Application.js';
import Survey from '@/models/Survey.js';
import { getCompanyCurrentUser } from '@/lib/auth.js';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      actualRoofArea,
      usableRoofArea,
      roofCondition,
      shadowFreeArea,
      installationFeasibility,
      recommendedSystemCapacity,
      surveyRemarks,
      surveyObservations,
    } = body;

    await connectToDatabase();
    const companyUser = await getCompanyCurrentUser();
    const updaterName = companyUser ? companyUser.name : 'Engineering Team';

    const application = await Application.findOne({
      $or: [{ applicationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!actualRoofArea || !usableRoofArea || !recommendedSystemCapacity) {
      return NextResponse.json(
        { error: 'Actual roof area, usable roof area, and recommended capacity are required.' },
        { status: 400 }
      );
    }

    const survey = await Survey.findOneAndUpdate(
      { applicationId: application.applicationId },
      {
        applicationId: application.applicationId,
        surveyorName: application.siteVisit?.assignedTo || updaterName,
        completedBy: updaterName,
        completedAt: new Date(),
        actualRoofArea: Number(actualRoofArea),
        usableRoofArea: Number(usableRoofArea),
        roofCondition: roofCondition || 'Good',
        shadowFreeArea: Number(shadowFreeArea || usableRoofArea),
        installationFeasibility: installationFeasibility || 'Highly Feasible',
        recommendedSystemCapacity: Number(recommendedSystemCapacity),
        surveyRemarks: surveyRemarks || '',
        surveyObservations: surveyObservations || '',
        visitStatus: 'COMPLETED',
      },
      { upsert: true, new: true }
    );

    const prevStatus = application.status;
    application.status = 'FINAL_QUOTATION';
    application.siteVisit.status = 'COMPLETED';
    application.siteVisit.completedAt = new Date();
    application.siteVisit.completedBy = updaterName;
    application.companyRemarks = `Site survey completed. Usable roof: ${usableRoofArea} sq ft. Recommended solar size: ${recommendedSystemCapacity} kW. Preparing official quotation.`;

    application.statusHistory.push({
      previousStatus: prevStatus,
      newStatus: 'FINAL_QUOTATION',
      stage: 'Site Survey Completed',
      title: 'Site Survey Completed',
      timestamp: new Date(),
      updatedBy: updaterName,
      notes: `Measured usable roof area: ${usableRoofArea} sq ft. Feasibility: ${installationFeasibility || 'Highly Feasible'}. Capacity: ${recommendedSystemCapacity} kW.`,
    });

    await application.save();

    return NextResponse.json({
      success: true,
      survey,
      application,
      message: 'Site survey recorded and completed successfully.',
    });
  } catch (error) {
    console.error('Survey save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save survey' }, { status: 500 });
  }
}
