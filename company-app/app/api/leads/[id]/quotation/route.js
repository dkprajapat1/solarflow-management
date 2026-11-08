import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db.js';
import Application from '@/models/Application.js';
import Quotation from '@/models/Quotation.js';
import Project from '@/models/Project.js';
import { generateQuotationId } from '@/lib/idGenerator.js';
import { getCompanyCurrentUser } from '@/lib/auth.js';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      capacityKw,
      panelModel,
      panelCount,
      inverterModel,
      pricingBreakdown,
      subsidy,
      netCustomerCost,
      metrics,
      status,
      revisionNotes,
    } = body;

    await connectToDatabase();
    const companyUser = await getCompanyCurrentUser();
    const updaterName = companyUser ? companyUser.name : 'Sales Operations';

    const application = await Application.findOne({
      $or: [{ applicationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const existingQuotation = await Quotation.findOne({ applicationId: application.applicationId });
    const quotationNumber = existingQuotation?.quotationNumber || generateQuotationId();
    const version = existingQuotation ? (existingQuotation.version || 1) + 1 : 1;
    const quotationStatus = status || 'Sent to customer';

    const quotation = await Quotation.findOneAndUpdate(
      { applicationId: application.applicationId },
      {
        quotationNumber,
        applicationId: application.applicationId,
        version,
        systemDetails: {
          capacityKw: Number(capacityKw),
          panelModel: panelModel || 'Mono PERC Bifacial 550W Tier-1 (DCR)',
          panelCount: Number(panelCount) || Math.ceil((Number(capacityKw) * 1000) / 550),
          inverterModel: inverterModel || 'Grid-Tied String Inverter (Wi-Fi Enabled)',
          warrantyYears: 25,
        },
        pricingBreakdown,
        subsidy,
        netCustomerCost: Number(netCustomerCost),
        metrics,
        status: quotationStatus,
        revisionNotes: revisionNotes || '',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    // Initialize or sync Project record
    await Project.findOneAndUpdate(
      { applicationId: application.applicationId },
      {
        applicationId: application.applicationId,
        projectStage: 'ADVANCE_PAYMENT_PENDING',
        'paymentDetails.advanceRequired': Math.round(Number(netCustomerCost) * 0.2),
        stageRemarks: 'Quotation sent. Awaiting customer confirmation and 20% advance milestone.',
      },
      { upsert: true }
    );

    const prevStatus = application.status;
    application.status = 'CUSTOMER_APPROVAL';
    application.companyRemarks = `Official quotation ${quotationNumber} (v${version}) generated for ${capacityKw} kW system. Net payable: ₹${Number(netCustomerCost).toLocaleString('en-IN')}.`;

    application.statusHistory.push({
      previousStatus: prevStatus,
      newStatus: 'CUSTOMER_APPROVAL',
      stage: 'Quotation Generated',
      title: `Quotation ${quotationNumber} Dispatched`,
      timestamp: new Date(),
      updatedBy: updaterName,
      notes: `System Size: ${capacityKw} kW. Net Customer Cost: ₹${Number(netCustomerCost).toLocaleString('en-IN')}. Status: ${quotationStatus}.`,
    });

    await application.save();

    return NextResponse.json({
      success: true,
      quotation,
      application,
      message: `Quotation ${quotationNumber} generated and saved successfully.`,
    });
  } catch (error) {
    console.error('Quotation save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save quotation' }, { status: 500 });
  }
}
