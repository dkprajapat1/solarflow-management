import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db.js';
import Application from '@/models/Application.js';
import { ensureDemoCompanyUsers } from '@/lib/auth.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectToDatabase();
    await ensureDemoCompanyUsers();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    const query = {};

    if (status && status !== 'ALL') {
      if (status === 'SITE_VISIT') {
        query.status = 'SITE_SURVEY';
      } else if (status === 'QUOTATION') {
        query.status = { $in: ['FINAL_QUOTATION', 'CUSTOMER_APPROVAL'] };
      } else if (status === 'INSTALLATION') {
        query.status = { $in: ['ADVANCE_PAYMENT', 'INSTALLATION_STARTED'] };
      } else if (status === 'COMPLETED') {
        query.status = { $in: ['INSTALLATION_COMPLETED', 'SUBSIDY_PROCESSING', 'SUBSIDY_CREDITED'] };
      } else {
        query.status = status;
      }
    }

    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { applicationId: { $regex: search, $options: 'i' } },
        { 'personalDetails.fullName': { $regex: search, $options: 'i' } },
        { 'personalDetails.city': { $regex: search, $options: 'i' } },
        { 'personalDetails.mobile': { $regex: search, $options: 'i' } },
        { 'electricityDetails.consumerNumber': { $regex: search, $options: 'i' } },
      ];
    }

    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const allApps = await Application.find({}).lean();

    // Calculate actual dashboard metrics directly from MongoDB records
    const metrics = {
      // 1. Total leads
      totalLeads: allApps.length,

      // 2. New leads (freshly submitted by homeowner)
      newLeads: allApps.filter((a) => a.status === 'SUBMITTED' || a.status === 'BILL_VERIFIED').length,

      // 3. Leads awaiting review (new or pending customer info)
      leadsAwaitingReview: allApps.filter((a) =>
        ['SUBMITTED', 'BILL_VERIFIED', 'COMPANY_REVIEW', 'INFO_REQUESTED'].includes(a.status)
      ).length,

      // 4. Site visits scheduled (status SITE_SURVEY with siteVisit.status === 'SCHEDULED')
      siteVisitsScheduled: allApps.filter(
        (a) => a.status === 'SITE_SURVEY' && a.siteVisit?.status === 'SCHEDULED'
      ).length,

      // 5. Site visits pending completion (accepted leads where visit is not yet completed)
      siteVisitsPendingCompletion: allApps.filter(
        (a) => a.status === 'SITE_SURVEY' && a.siteVisit?.status !== 'COMPLETED'
      ).length,

      // 6. Quotations awaiting approval (quotation prepared / sent, waiting customer decision)
      quotationsAwaitingApproval: allApps.filter((a) =>
        ['FINAL_QUOTATION', 'CUSTOMER_APPROVAL'].includes(a.status)
      ).length,

      // 7. Active installations (advance received, installation in progress)
      activeInstallations: allApps.filter((a) =>
        ['ADVANCE_PAYMENT', 'INSTALLATION_STARTED'].includes(a.status)
      ).length,

      // 8. Completed projects (installation completed / subsidy credited)
      completedProjects: allApps.filter((a) =>
        ['INSTALLATION_COMPLETED', 'SUBSIDY_PROCESSING', 'SUBSIDY_CREDITED'].includes(a.status)
      ).length,

      // Ancillary counts
      rejectedLeads: allApps.filter((a) => a.status === 'REJECTED').length,
    };

    return NextResponse.json({
      success: true,
      applications,
      metrics,
    });
  } catch (error) {
    console.error('Fetch company leads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company leads from database' },
      { status: 500 }
    );
  }
}
