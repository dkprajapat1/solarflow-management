import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db.js';
import Application from '@/models/Application.js';
import Survey from '@/models/Survey.js';
import Quotation from '@/models/Quotation.js';
import Project from '@/models/Project.js';
import { getCompanyCurrentUser } from '@/lib/auth.js';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action } = body;

    await connectToDatabase();
    const companyUser = await getCompanyCurrentUser();
    const updaterName = companyUser ? companyUser.name : 'Company Staff';

    const application = await Application.findOne({
      $or: [{ applicationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const previousStatus = application.status;
    let newStatus = previousStatus;
    let actionTitle = '';
    let actionNotes = '';

    // ==========================================
    // STAGE 1: LEAD MANAGEMENT
    // ==========================================
    if (action === 'ACCEPT_LEAD') {
      newStatus = 'SITE_SURVEY';
      actionTitle = 'Lead Accepted';
      actionNotes = body.remarks || 'Customer lead accepted by sales team. Ready for site visit scheduling.';
      application.companyRemarks = actionNotes;
    } else if (action === 'REJECT_LEAD') {
      const reason = (body.reason || '').trim();
      if (!reason) {
        return NextResponse.json(
          { error: 'A mandatory rejection reason is required to reject a lead.' },
          { status: 400 }
        );
      }
      newStatus = 'REJECTED';
      actionTitle = 'Lead Rejected';
      actionNotes = `Rejection reason: ${reason}`;
      application.rejectionReason = reason;
      application.companyRemarks = actionNotes;
    } else if (action === 'REQUEST_INFO') {
      const notes = (body.remarks || body.notes || '').trim();
      if (!notes) {
        return NextResponse.json(
          { error: 'Please specify the information or documents requested from the customer.' },
          { status: 400 }
        );
      }
      newStatus = 'INFO_REQUESTED';
      actionTitle = 'Additional Information Requested';
      actionNotes = notes;
      application.companyRemarks = `Information requested: ${notes}`;
    }

    // ==========================================
    // STAGE 2: SITE VISIT MANAGEMENT
    // ==========================================
    else if (action === 'SCHEDULE_SITE_VISIT') {
      const { visitDate, timeSlot, assignedTo, remarks } = body;
      if (!visitDate) {
        return NextResponse.json(
          { error: 'Site visit date is required.' },
          { status: 400 }
        );
      }

      const assignedStaff = assignedTo || 'Technical Field Surveyor';
      const slot = timeSlot || '10:00 AM - 01:00 PM';
      const scheduledDateObj = new Date(visitDate);

      // Update Application siteVisit state (strictly remains in SITE_SURVEY)
      application.siteVisit = {
        status: 'SCHEDULED',
        scheduledDate: scheduledDateObj,
        timeSlot: slot,
        assignedTo: assignedStaff,
        remarks: remarks || '',
        rescheduledCount: application.siteVisit?.rescheduledCount || 0,
      };
      application.companyRemarks = `Site visit scheduled for ${scheduledDateObj.toLocaleDateString('en-IN')} (${slot}) with ${assignedStaff}.`;

      // Sync/Upsert Survey record
      await Survey.findOneAndUpdate(
        { applicationId: application.applicationId },
        {
          applicationId: application.applicationId,
          surveyorName: assignedStaff,
          assignedStaff,
          scheduledDate: scheduledDateObj,
          scheduledTimeSlot: slot,
          visitStatus: 'SCHEDULED',
        },
        { upsert: true, new: true }
      );

      actionTitle = 'Site Visit Scheduled';
      actionNotes = `Assigned to: ${assignedStaff} on ${scheduledDateObj.toLocaleDateString('en-IN')} (${slot}). Notes: ${remarks || 'None'}`;
    } else if (action === 'RESCHEDULE_SITE_VISIT') {
      const { newVisitDate, newTimeSlot, reason } = body;
      if (!newVisitDate) {
        return NextResponse.json(
          { error: 'New visit date is required for rescheduling.' },
          { status: 400 }
        );
      }

      const scheduledDateObj = new Date(newVisitDate);
      const slot = newTimeSlot || application.siteVisit?.timeSlot || '10:00 AM - 01:00 PM';

      application.siteVisit.status = 'SCHEDULED';
      application.siteVisit.scheduledDate = scheduledDateObj;
      application.siteVisit.timeSlot = slot;
      application.siteVisit.rescheduledCount = (application.siteVisit.rescheduledCount || 0) + 1;
      application.companyRemarks = `Site visit rescheduled to ${scheduledDateObj.toLocaleDateString('en-IN')} (${slot}). Reason: ${reason || 'Customer request'}`;

      await Survey.findOneAndUpdate(
        { applicationId: application.applicationId },
        {
          scheduledDate: scheduledDateObj,
          scheduledTimeSlot: slot,
          visitStatus: 'SCHEDULED',
          rescheduleReason: reason || 'Rescheduled by staff',
        }
      );

      actionTitle = 'Site Visit Rescheduled';
      actionNotes = `New Date: ${scheduledDateObj.toLocaleDateString('en-IN')} (${slot}). Reason: ${reason || 'Not specified'}`;
    } else if (action === 'MARK_VISIT_MISSED') {
      const reason = (body.reason || 'Customer not available at site').trim();
      application.siteVisit.status = 'MISSED';
      application.siteVisit.missedReason = reason;
      application.companyRemarks = `Site visit missed: ${reason}. Awaiting rescheduling.`;

      await Survey.findOneAndUpdate(
        { applicationId: application.applicationId },
        {
          visitStatus: 'MISSED',
          cancellationReason: reason,
        }
      );

      actionTitle = 'Site Visit Missed';
      actionNotes = `Visit missed: ${reason}. Rescheduling required.`;
    } else if (action === 'MARK_VISIT_CANCELLED') {
      const reason = (body.reason || 'Cancelled by staff or customer').trim();
      application.siteVisit.status = 'CANCELLED';
      application.siteVisit.cancellationReason = reason;
      application.companyRemarks = `Site visit cancelled: ${reason}.`;

      await Survey.findOneAndUpdate(
        { applicationId: application.applicationId },
        {
          visitStatus: 'CANCELLED',
          cancellationReason: reason,
        }
      );

      actionTitle = 'Site Visit Cancelled';
      actionNotes = `Visit cancelled: ${reason}`;
    }

    // Explicit Action: Mark Site Visit Completed
    else if (action === 'COMPLETE_SITE_VISIT') {
      const {
        actualRoofArea,
        usableRoofArea,
        shadowFreeArea,
        roofCondition,
        installationFeasibility,
        recommendedSystemCapacity,
        surveyRemarks,
        surveyObservations,
      } = body;

      if (!actualRoofArea || !usableRoofArea || !recommendedSystemCapacity) {
        return NextResponse.json(
          { error: 'Actual roof area, usable roof area, and recommended capacity are required to complete survey.' },
          { status: 400 }
        );
      }

      // Update Site Visit on Application
      application.siteVisit.status = 'COMPLETED';
      application.siteVisit.completedAt = new Date();
      application.siteVisit.completedBy = updaterName;

      // Advance Application status to FINAL_QUOTATION
      newStatus = 'FINAL_QUOTATION';
      actionTitle = 'Site Visit Completed';
      actionNotes = `Measured usable roof area: ${usableRoofArea} sq ft. Feasibility: ${installationFeasibility || 'Highly Feasible'}. Recommended Capacity: ${recommendedSystemCapacity} kW.`;
      application.companyRemarks = actionNotes;

      // Save complete Survey document
      await Survey.findOneAndUpdate(
        { applicationId: application.applicationId },
        {
          applicationId: application.applicationId,
          surveyorName: application.siteVisit.assignedTo || updaterName,
          completedBy: updaterName,
          completedAt: new Date(),
          visitStatus: 'COMPLETED',
          actualRoofArea: Number(actualRoofArea),
          usableRoofArea: Number(usableRoofArea),
          shadowFreeArea: Number(shadowFreeArea || usableRoofArea),
          roofCondition: roofCondition || 'Good',
          installationFeasibility: installationFeasibility || 'Highly Feasible',
          recommendedSystemCapacity: Number(recommendedSystemCapacity),
          surveyRemarks: surveyRemarks || '',
          surveyObservations: surveyObservations || '',
        },
        { upsert: true, new: true }
      );
    }

    // ==========================================
    // STAGE 3: QUOTATION MANAGEMENT
    // ==========================================
    else if (action === 'UPDATE_QUOTATION_STATUS') {
      const { quotationStatus, remarks } = body;
      const validStatuses = ['Draft', 'Sent to customer', 'Approved', 'Rejected', 'Revised'];
      if (!validStatuses.includes(quotationStatus)) {
        return NextResponse.json(
          { error: `Invalid quotation status. Choose from: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      const quotation = await Quotation.findOne({ applicationId: application.applicationId });
      if (!quotation) {
        return NextResponse.json(
          { error: 'No quotation exists for this lead yet. Build a quotation first.' },
          { status: 400 }
        );
      }

      quotation.status = quotationStatus;
      if (remarks) quotation.revisionNotes = remarks;

      if (quotationStatus === 'Approved') {
        newStatus = 'ADVANCE_PAYMENT';
        actionTitle = 'Quotation Approved by Customer';
        actionNotes = remarks || `Quotation ${quotation.quotationNumber} approved. Ready to collect advance payment.`;
        application.companyRemarks = actionNotes;

        // Initialize Project record
        await Project.findOneAndUpdate(
          { applicationId: application.applicationId },
          {
            applicationId: application.applicationId,
            projectStage: 'ADVANCE_PAYMENT_PENDING',
            'paymentDetails.advanceRequired': Math.round(quotation.netCustomerCost * 0.2),
            stageRemarks: 'Awaiting advance milestone payment (20%).',
          },
          { upsert: true }
        );
      } else if (quotationStatus === 'Revised') {
        quotation.version = (quotation.version || 1) + 1;
        actionTitle = `Quotation Revised (v${quotation.version})`;
        actionNotes = remarks || `Quotation revised by ${updaterName}.`;
        application.companyRemarks = actionNotes;
      } else if (quotationStatus === 'Rejected') {
        actionTitle = 'Quotation Declined by Customer';
        actionNotes = remarks || 'Customer declined the presented quotation.';
        application.companyRemarks = actionNotes;
      } else {
        actionTitle = `Quotation status updated to ${quotationStatus}`;
        actionNotes = remarks || `Updated by ${updaterName}`;
      }

      await quotation.save();
    }

    // ==========================================
    // STAGE 4: PROJECT MANAGEMENT WORKFLOW
    // ==========================================
    else if (action === 'UPDATE_PROJECT_STAGE') {
      const { projectStage, remarks, paymentAmount, scheduledDate, installerTeam, portalRefNumber, disbursedAmount } = body;

      const project = await Project.findOne({ applicationId: application.applicationId });
      if (!project) {
        return NextResponse.json(
          { error: 'Project record not initialized for this application.' },
          { status: 400 }
        );
      }

      const prevStage = project.projectStage;
      project.projectStage = projectStage;
      project.stageRemarks = remarks || '';

      if (projectStage === 'ADVANCE_PAYMENT_RECEIVED') {
        project.paymentDetails.advancePaid = true;
        project.paymentDetails.advanceReceived = true;
        project.paymentDetails.advanceReceivedAmount = Number(paymentAmount) || project.paymentDetails.advanceRequired;
        project.paymentDetails.advanceReceivedDate = new Date();
        newStatus = 'INSTALLATION_STARTED';
        actionTitle = 'Advance Payment Recorded';
        actionNotes = `Advance payment of ₹${(project.paymentDetails.advanceReceivedAmount).toLocaleString('en-IN')} received.`;
        application.companyRemarks = actionNotes;
      } else if (projectStage === 'INSTALLATION_SCHEDULED') {
        project.installationDetails.scheduledDate = scheduledDate ? new Date(scheduledDate) : new Date();
        project.installationDetails.installerTeam = installerTeam || 'SolarFlow Certified Installers';
        newStatus = 'INSTALLATION_STARTED';
        actionTitle = 'Installation Scheduled';
        actionNotes = `Installation team (${project.installationDetails.installerTeam}) scheduled for ${new Date(project.installationDetails.scheduledDate).toLocaleDateString('en-IN')}.`;
        application.companyRemarks = actionNotes;
      } else if (projectStage === 'INSTALLATION_STARTED') {
        project.installationDetails.startedAt = new Date();
        newStatus = 'INSTALLATION_STARTED';
        actionTitle = 'Installation Started';
        actionNotes = remarks || 'Physical rooftop mounting, panel cabling & inverter connection underway.';
        application.companyRemarks = actionNotes;
      } else if (projectStage === 'INSTALLATION_COMPLETED') {
        project.installationDetails.completedAt = new Date();
        newStatus = 'INSTALLATION_COMPLETED';
        actionTitle = 'Installation Completed';
        actionNotes = remarks || 'Rooftop solar plant physical assembly complete. Ready for DISCOM net-meter inspection.';
        application.companyRemarks = actionNotes;
      } else if (projectStage === 'INSPECTION_PENDING') {
        actionTitle = 'DISCOM Net-Meter Inspection Pending';
        actionNotes = remarks || 'Commissioning inspection requested from utility authority.';
        application.companyRemarks = actionNotes;
      } else if (projectStage === 'INSPECTION_COMPLETED') {
        project.inspectionDetails.inspectionPassed = true;
        project.inspectionDetails.inspectionDate = new Date();
        project.inspectionDetails.discomRemarks = remarks || 'Net-meter synchronization verified and passed.';
        actionTitle = 'DISCOM Inspection Passed';
        actionNotes = 'Net-meter installed and bidirectional power flow verified.';
        application.companyRemarks = actionNotes;
      } else if (projectStage === 'SUBSIDY_APPLICATION_SUBMITTED') {
        project.subsidyDetails.portalRefNumber = portalRefNumber || `PM-SG-${Date.now().toString().slice(-6)}`;
        project.subsidyDetails.applicationDate = new Date();
        newStatus = 'SUBSIDY_PROCESSING';
        actionTitle = 'Subsidy Application Submitted';
        actionNotes = `National Portal Application ref: ${project.subsidyDetails.portalRefNumber}`;
        application.companyRemarks = actionNotes;
      } else if (projectStage === 'SUBSIDY_PROCESSING') {
        newStatus = 'SUBSIDY_PROCESSING';
        actionTitle = 'Subsidy Under DISCOM Verification';
        actionNotes = remarks || 'Direct Benefit Transfer (DBT) approval in process.';
        application.companyRemarks = actionNotes;
      } else if (projectStage === 'SUBSIDY_CREDITED') {
        project.subsidyDetails.disbursedAmount = Number(disbursedAmount) || application.preliminaryEstimate?.subsidyAmount || 78000;
        project.subsidyDetails.disbursedDate = new Date();
        newStatus = 'SUBSIDY_CREDITED';
        actionTitle = 'Govt Subsidy Credited to Customer';
        actionNotes = `PM Surya Ghar subsidy of ₹${project.subsidyDetails.disbursedAmount.toLocaleString('en-IN')} successfully credited to customer bank account.`;
        application.companyRemarks = actionNotes;
      } else if (projectStage === 'PROJECT_COMPLETED') {
        newStatus = 'SUBSIDY_CREDITED';
        actionTitle = 'Project Commissioned & Completed';
        actionNotes = remarks || 'Rooftop solar installation fully commissioned, subsidized and grid-connected. Project closed.';
        application.companyRemarks = actionNotes;
      }

      project.stageHistory.push({
        fromStage: prevStage,
        toStage: projectStage,
        remarks: remarks || actionNotes,
        updatedBy: updaterName,
        timestamp: new Date(),
      });
      await project.save();
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Update Application Status & Append to statusHistory
    application.status = newStatus;
    application.statusHistory.push({
      previousStatus,
      newStatus,
      stage: actionTitle,
      title: actionTitle,
      timestamp: new Date(),
      updatedBy: updaterName,
      notes: actionNotes,
    });

    await application.save();

    return NextResponse.json({
      success: true,
      message: actionTitle,
      application,
    });
  } catch (error) {
    console.error('Lead action error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute lead action' },
      { status: 500 }
    );
  }
}
