'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import CompanyLayout from '@/components/CompanyLayout';
import {
  Users,
  CheckCircle2,
  Home,
  Zap,
  ArrowLeft,
  DollarSign,
  XCircle,
  HelpCircle,
  Layers,
  Calendar,
  Clock,
  Wrench,
  FileCheck2,
  AlertTriangle,
  FileText,
  MapPin,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function LeadDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [lead, setLead] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [requestInfoModalOpen, setRequestInfoModalOpen] = useState(false);
  const [requestInfoNotes, setRequestInfoNotes] = useState('');

  const [scheduleVisitModalOpen, setScheduleVisitModalOpen] = useState(false);
  const [visitScheduleData, setVisitScheduleData] = useState({
    visitDate: '',
    timeSlot: '10:00 AM - 01:00 PM',
    assignedTo: 'Vikram Singh (Senior Field Engineer)',
    remarks: '',
  });

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    newVisitDate: '',
    newTimeSlot: '10:00 AM - 01:00 PM',
    reason: '',
  });

  const [missedVisitModalOpen, setMissedVisitModalOpen] = useState(false);
  const [missedReason, setMissedReason] = useState('');

  const [projectStageModalOpen, setProjectStageModalOpen] = useState(false);
  const [projectActionPayload, setProjectActionPayload] = useState({
    projectStage: '',
    title: '',
    remarks: '',
    paymentAmount: '',
    scheduledDate: '',
    installerTeam: 'SolarFlow Certified Operations Team',
    portalRefNumber: '',
    disbursedAmount: '',
  });

  const fetchLeadData = () => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/leads/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.application) {
          setLead(data.application);
          setSurvey(data.survey || null);
          setQuotation(data.quotation || null);
          setProject(data.project || null);
        }
      })
      .catch((err) => console.error('Fetch lead error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeadData();
  }, [id]);

  const executeAction = async (action, extraData = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/leads/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed to execute');

      // Close all modals
      setRejectModalOpen(false);
      setRequestInfoModalOpen(false);
      setScheduleVisitModalOpen(false);
      setRescheduleModalOpen(false);
      setMissedVisitModalOpen(false);
      setProjectStageModalOpen(false);

      // Refresh data
      fetchLeadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !lead) {
    return (
      <CompanyLayout>
        <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
          <span>Loading application record...</span>
        </div>
      </CompanyLayout>
    );
  }

  // Determine Next Action and Pending Summary
  const isLeadPendingReview = ['SUBMITTED', 'BILL_VERIFIED', 'COMPANY_REVIEW'].includes(lead.status);
  const isSiteSurveyStage = lead.status === 'SITE_SURVEY';
  const isVisitScheduled = lead.siteVisit?.status === 'SCHEDULED';
  const isVisitCompleted = lead.siteVisit?.status === 'COMPLETED';
  const isQuotationStage = lead.status === 'FINAL_QUOTATION';
  const isCustomerApprovalStage = lead.status === 'CUSTOMER_APPROVAL';
  const isProjectExecutionStage = [
    'ADVANCE_PAYMENT',
    'INSTALLATION_STARTED',
    'INSTALLATION_COMPLETED',
    'SUBSIDY_PROCESSING',
    'SUBSIDY_CREDITED',
  ].includes(lead.status);

  return (
    <CompanyLayout>
      <div className="space-y-6">
        {/* Top Breadcrumb & Quick Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3">
          <Link
            href="/leads"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Lead Pipeline</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Link
              href={`/leads/${lead.applicationId}/survey`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
            >
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>Survey Form</span>
            </Link>
            <Link
              href={`/leads/${lead.applicationId}/quotation`}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-colors shadow-xs"
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Quotation Builder</span>
            </Link>
          </div>
        </div>

        {/* Lead Cockpit Banner */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-2xl font-black font-mono text-slate-900">
                {lead.applicationId}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  lead.status === 'SUBMITTED'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : lead.status === 'SITE_SURVEY'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : lead.status === 'FINAL_QUOTATION'
                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                    : lead.status === 'CUSTOMER_APPROVAL'
                    ? 'bg-purple-50 text-purple-800 border border-purple-200'
                    : lead.status === 'INSTALLATION_STARTED'
                    ? 'bg-orange-50 text-orange-800 border border-orange-200'
                    : ['INSTALLATION_COMPLETED', 'SUBSIDY_CREDITED'].includes(lead.status)
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : lead.status === 'REJECTED'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {lead.status}
              </span>

              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  lead.priority === 'High'
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {lead.priority || 'Medium'} Priority
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Submitted on{' '}
              <strong>
                {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>{' '}
              by <strong className="text-slate-800">{lead.personalDetails?.fullName}</strong> ({lead.personalDetails?.city})
            </p>
          </div>

          {/* Primary Action Buttons (Workflow Triggers) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage 1 Actions */}
            {isLeadPendingReview && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  executeAction('ACCEPT_LEAD', {
                    remarks: 'Application accepted. Proceeding to physical rooftop site survey scheduling.',
                  })
                }
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Accept Lead</span>
              </button>
            )}

            {/* Stage 2 Actions (Site Visit) */}
            {isSiteSurveyStage && !isVisitScheduled && !isVisitCompleted && (
              <button
                type="button"
                onClick={() => setScheduleVisitModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <Calendar className="h-4 w-4" />
                <span>Schedule Site Visit</span>
              </button>
            )}

            {isSiteSurveyStage && isVisitScheduled && (
              <>
                <Link
                  href={`/leads/${lead.applicationId}/survey`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark Visit Completed</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Reschedule
                </button>

                <button
                  type="button"
                  onClick={() => setMissedVisitModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 hover:bg-orange-100 font-semibold text-xs transition-colors"
                >
                  Mark Missed
                </button>
              </>
            )}

            {/* Stage 3 Actions */}
            {isQuotationStage && (
              <Link
                href={`/leads/${lead.applicationId}/quotation`}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <DollarSign className="h-4 w-4" />
                <span>Prepare Final Quotation</span>
              </Link>
            )}

            {isCustomerApprovalStage && quotation && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  executeAction('UPDATE_QUOTATION_STATUS', {
                    quotationStatus: 'Approved',
                    remarks: 'Customer reviewed and approved the official quotation.',
                  })
                }
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Record Customer Approval</span>
              </button>
            )}

            {/* Stage 4 Actions (Project Lifecycle) */}
            {isProjectExecutionStage && (
              <button
                type="button"
                onClick={() => {
                  const stage = project?.projectStage || 'ADVANCE_PAYMENT_PENDING';
                  if (stage === 'ADVANCE_PAYMENT_PENDING') {
                    setProjectActionPayload({
                      projectStage: 'ADVANCE_PAYMENT_RECEIVED',
                      title: 'Record Advance Payment Received',
                      remarks: 'Received 20% advance milestone deposit from customer.',
                      paymentAmount: project?.paymentDetails?.advanceRequired || 35000,
                    });
                  } else if (stage === 'ADVANCE_PAYMENT_RECEIVED' || stage === 'INSTALLATION_SCHEDULED') {
                    setProjectActionPayload({
                      projectStage: 'INSTALLATION_STARTED',
                      title: 'Start Rooftop Solar Installation',
                      remarks: 'Solar installation team dispatched to site; panel mounting commenced.',
                      installerTeam: 'SolarFlow Certified Operations Team',
                    });
                  } else if (stage === 'INSTALLATION_STARTED') {
                    setProjectActionPayload({
                      projectStage: 'INSTALLATION_COMPLETED',
                      title: 'Mark Installation Completed',
                      remarks: 'Rooftop structure, solar panels, and inverter commissioned and tested.',
                    });
                  } else if (stage === 'INSTALLATION_COMPLETED' || stage === 'INSPECTION_PENDING') {
                    setProjectActionPayload({
                      projectStage: 'INSPECTION_COMPLETED',
                      title: 'Record DISCOM Net-Meter Inspection Passed',
                      remarks: 'DISCOM engineering inspector approved net-metering synchronization.',
                    });
                  } else if (stage === 'INSPECTION_COMPLETED') {
                    setProjectActionPayload({
                      projectStage: 'SUBSIDY_APPLICATION_SUBMITTED',
                      title: 'Submit PM Surya Ghar Subsidy Claim',
                      remarks: 'Application filed on National Portal for Rooftop Solar.',
                      portalRefNumber: `PM-SG-${Date.now().toString().slice(-6)}`,
                    });
                  } else if (stage === 'SUBSIDY_APPLICATION_SUBMITTED' || stage === 'SUBSIDY_PROCESSING') {
                    setProjectActionPayload({
                      projectStage: 'SUBSIDY_CREDITED',
                      title: 'Record Subsidy Credited to Customer',
                      remarks: 'DBT central government subsidy credited directly to customer bank account.',
                      disbursedAmount: lead.preliminaryEstimate?.subsidyAmount || 78000,
                    });
                  } else if (stage === 'SUBSIDY_CREDITED') {
                    setProjectActionPayload({
                      projectStage: 'PROJECT_COMPLETED',
                      title: 'Mark Project Completed & Closed',
                      remarks: 'Turnkey solar plant live, synchronized to grid, fully subsidized.',
                    });
                  }
                  setProjectStageModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <Wrench className="h-4 w-4" />
                <span>Advance Project Milestone</span>
              </button>
            )}

            {/* Request Info & Reject Buttons */}
            {lead.status !== 'REJECTED' && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setRequestInfoModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center space-x-1.5"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Request Info</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setRejectModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 font-semibold text-xs transition-colors flex items-center space-x-1.5"
                >
                  <XCircle className="h-3.5 w-3.5 text-rose-600" />
                  <span>Reject</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Context Guidance Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start space-x-3">
          <Sparkles className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">Current Workflow Stage: </span>
            <span className="text-slate-700 font-semibold">{lead.companyRemarks || 'Pending review.'}</span>
          </div>
        </div>

        {/* 3-Column Core Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Customer Information */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>Customer Contact</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Full Name</span>
                <strong className="text-sm text-slate-900 block font-bold">
                  {lead.personalDetails?.fullName}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phone & Email</span>
                <div className="font-mono text-slate-700 flex items-center space-x-1 mt-0.5">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span>{lead.personalDetails?.mobile}</span>
                </div>
                <div className="text-slate-600 flex items-center space-x-1 mt-0.5">
                  <Mail className="h-3 w-3 text-slate-400" />
                  <span className="truncate">{lead.personalDetails?.email}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Installation Address</span>
                <span className="text-slate-700 leading-tight block">
                  {lead.personalDetails?.address}, {lead.personalDetails?.city}, {lead.personalDetails?.state} - {lead.personalDetails?.pincode}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Property & Roof Details */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Home className="h-4 w-4 text-emerald-600" />
              <span>Property & Rooftop</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Ownership & Type</span>
                <span className="text-slate-800 font-semibold">
                  {lead.propertyDetails?.ownership} • {lead.propertyDetails?.propertyType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Roof Construction</span>
                <span className="text-slate-800 font-semibold">
                  {lead.propertyDetails?.roofType} Roof
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Reported Roof Area</span>
                <span className="text-emerald-700 font-bold text-sm block">
                  {lead.propertyDetails?.availableRoofArea} sq. ft.
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Estimated Capacity: ~{(Number(lead.propertyDetails?.availableRoofArea) / 90).toFixed(1)} kW
                </span>
              </div>
            </div>
          </div>

          {/* 3. Electricity & Bill OCR Details */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>Electricity & OCR Verification</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Consumer Account No.</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {lead.electricityDetails?.consumerNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tariff & Sanctioned Load</span>
                <span className="text-slate-800 font-semibold">
                  {lead.electricityDetails?.tariffCategory} • {lead.electricityDetails?.sanctionedLoad} kW
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Monthly Consumption & Bill</span>
                <span className="text-slate-800 font-semibold">
                  {lead.electricityDetails?.averageMonthlyUnits} Units • ₹
                  {Number(lead.electricityDetails?.monthlyBill || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">OCR Verification Status</span>
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-bold text-[10px] ${
                    lead.verificationStatus?.isMatched
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <ShieldCheck className="h-3 w-3" />
                  <span>{lead.verificationStatus?.status || 'VERIFIED'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Site Survey Card (if scheduled or recorded) */}
        {survey && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                <span>Site Visit & Engineering Survey Report</span>
              </h3>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  survey.visitStatus === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : survey.visitStatus === 'MISSED'
                    ? 'bg-orange-50 text-orange-800 border border-orange-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                Visit Status: {survey.visitStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Assigned Engineer</span>
                <strong className="text-slate-800 font-bold block mt-0.5">
                  {survey.surveyorName || 'Technical Team'}
                </strong>
                {survey.scheduledDate && (
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Date: {new Date(survey.scheduledDate).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Measured Usable Area</span>
                <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                  {survey.usableRoofArea || 'Pending'} sq. ft.
                </strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Condition: {survey.roofCondition || 'Good'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Installation Feasibility</span>
                <strong className="text-emerald-700 font-bold block mt-0.5">
                  {survey.installationFeasibility || 'Highly Feasible'}
                </strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Shadow Free: {survey.shadowFreeArea || survey.usableRoofArea} sq ft
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Recommended Capacity</span>
                <strong className="text-emerald-700 font-bold text-sm block mt-0.5">
                  {survey.recommendedSystemCapacity || lead.preliminaryEstimate?.recommendedCapacity} kW
                </strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">Confirmed via on-site measurement</span>
              </div>
            </div>

            {survey.surveyRemarks && (
              <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong>Surveyor Remarks: </strong>
                {survey.surveyRemarks}
              </p>
            )}
          </div>
        )}

        {/* Quotation Summary Card (if generated) */}
        {quotation && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span>Official Proposal & Quotation ({quotation.quotationNumber})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Version {quotation.version || 1}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    quotation.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : quotation.status === 'Rejected'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : quotation.status === 'Revised'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  Status: {quotation.status}
                </span>

                <Link
                  href={`/leads/${lead.applicationId}/quotation`}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-1"
                >
                  <Printer className="h-3 w-3" />
                  <span>Print / View</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">System Sizing</span>
                <strong className="text-slate-900 font-bold block mt-0.5">
                  {quotation.systemDetails?.capacityKw} kW
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  {quotation.systemDetails?.panelCount} × Bifacial Panels
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Turnkey Gross Cost</span>
                <strong className="text-slate-900 font-bold block mt-0.5">
                  ₹{Number(quotation.pricingBreakdown?.grossTotal || 0).toLocaleString('en-IN')}
                </strong>
                <span className="text-[10px] text-slate-500 block">Includes GST & installation</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-emerald-800 block text-[11px] font-semibold">Central Subsidy</span>
                <strong className="text-emerald-800 font-bold block mt-0.5">
                  -₹{Number(quotation.subsidy?.totalSubsidy || 0).toLocaleString('en-IN')}
                </strong>
                <span className="text-[10px] text-emerald-700 block">PM Surya Ghar Yojana</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-white">
                <span className="text-slate-400 block text-[11px]">Net Customer Payable</span>
                <strong className="text-emerald-400 font-black text-sm block mt-0.5">
                  ₹{Number(quotation.netCustomerCost || 0).toLocaleString('en-IN')}
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  Payback: ~{quotation.metrics?.estimatedPaybackYears || 4.2} Years
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Project Lifecycle Milestone Tracker (if lead reached Project phase) */}
        {project && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Wrench className="h-4 w-4 text-purple-600" />
                <span>Project Execution & Grid Synchronization</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  const stage = project?.projectStage || 'ADVANCE_PAYMENT_PENDING';
                  setProjectActionPayload({
                    projectStage: stage,
                    title: `Update Milestone (${stage})`,
                    remarks: '',
                    paymentAmount: project?.paymentDetails?.advanceRequired || 35000,
                    scheduledDate: '',
                    installerTeam: 'SolarFlow Certified Operations Team',
                    portalRefNumber: `PM-SG-${Date.now().toString().slice(-6)}`,
                    disbursedAmount: lead.preliminaryEstimate?.subsidyAmount || 78000,
                  });
                  setProjectStageModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Update Milestone
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Current Stage</span>
                <strong className="text-purple-800 font-bold block mt-0.5">
                  {project.projectStage}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Advance Payment (20%)</span>
                <strong className={`block mt-0.5 font-bold ${project.paymentDetails?.advancePaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {project.paymentDetails?.advancePaid ? 'Received' : 'Pending'}
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  Required: ₹{Number(project.paymentDetails?.advanceRequired || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">DISCOM Inspection</span>
                <strong className={`block mt-0.5 font-bold ${project.inspectionDetails?.inspectionPassed ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {project.inspectionDetails?.inspectionPassed ? 'Passed' : 'Pending'}
                </strong>
                <span className="text-[10px] text-slate-500 block">Net-metering verification</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Subsidy Processing</span>
                <strong className={`block mt-0.5 font-bold ${project.subsidyDetails?.disbursedAmount ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {project.subsidyDetails?.disbursedAmount ? `Credited (₹${Number(project.subsidyDetails.disbursedAmount).toLocaleString('en-IN')})` : project.subsidyDetails?.portalRefNumber ? 'Application Filed' : 'Not Applied'}
                </strong>
                {project.subsidyDetails?.portalRefNumber && (
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Ref: {project.subsidyDetails.portalRefNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status History Timeline */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>Status History & Audit Trail</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Chronological record of every workflow update</p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {(lead.statusHistory || []).length} Recorded Milestones
            </span>
          </div>

          <div className="space-y-4">
            {(lead.statusHistory || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No history events recorded.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-2 before:w-0.5 before:bg-slate-200">
                {[...(lead.statusHistory || [])].reverse().map((event, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-xs font-bold text-slate-900">
                          {event.title || event.stage}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(event.timestamp).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          By: {event.updatedBy || 'Staff'}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODAL 1: Schedule Site Visit */}
        {scheduleVisitModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">Schedule Site Visit</h3>
              <p className="text-xs text-slate-500 mb-4">
                Assign a certified field engineer to conduct rooftop physical measurements and feasibility assessment.
              </p>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Site Visit Date *</label>
                  <input
                    type="date"
                    value={visitScheduleData.visitDate}
                    onChange={(e) => setVisitScheduleData({ ...visitScheduleData, visitDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    value={visitScheduleData.timeSlot}
                    onChange={(e) => setVisitScheduleData({ ...visitScheduleData, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="10:00 AM - 01:00 PM">Morning (10:00 AM - 01:00 PM)</option>
                    <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM - 05:00 PM)</option>
                    <option value="05:00 PM - 07:00 PM">Evening (05:00 PM - 07:00 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Field Staff *</label>
                  <input
                    type="text"
                    value={visitScheduleData.assignedTo}
                    onChange={(e) => setVisitScheduleData({ ...visitScheduleData, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Visit Instructions / Remarks</label>
                  <textarea
                    rows={2}
                    value={visitScheduleData.remarks}
                    onChange={(e) => setVisitScheduleData({ ...visitScheduleData, remarks: e.target.value })}
                    placeholder="e.g. Call customer 30 minutes prior to arrival..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setScheduleVisitModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !visitScheduleData.visitDate}
                  onClick={() => executeAction('SCHEDULE_SITE_VISIT', visitScheduleData)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                >
                  Confirm Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Reschedule Visit */}
        {rescheduleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">Reschedule Site Visit</h3>
              <p className="text-xs text-slate-500 mb-4">Select an alternate date and document the reason.</p>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Visit Date *</label>
                  <input
                    type="date"
                    value={rescheduleData.newVisitDate}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, newVisitDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Time Slot</label>
                  <select
                    value={rescheduleData.newTimeSlot}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, newTimeSlot: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="10:00 AM - 01:00 PM">Morning (10:00 AM - 01:00 PM)</option>
                    <option value="02:00 PM - 05:00 PM">Afternoon (02:00 PM - 05:00 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rescheduling Reason *</label>
                  <input
                    type="text"
                    value={rescheduleData.reason}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                    placeholder="e.g. Customer requested weekend slot..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !rescheduleData.newVisitDate}
                  onClick={() => executeAction('RESCHEDULE_SITE_VISIT', rescheduleData)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                >
                  Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Mark Visit Missed */}
        {missedVisitModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">Mark Site Visit Missed</h3>
              <p className="text-xs text-slate-500 mb-4">
                Record reason why the visit could not take place as scheduled (e.g. customer unavailable, premise locked).
              </p>
              <textarea
                rows={3}
                value={missedReason}
                onChange={(e) => setMissedReason(e.target.value)}
                placeholder="Document reason for missed visit..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMissedVisitModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeAction('MARK_VISIT_MISSED', { reason: missedReason })}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white"
                >
                  Confirm Missed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: Reject Lead */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-rose-900 mb-1">Reject Solar Lead</h3>
              <p className="text-xs text-slate-500 mb-4">
                A documented reason is mandatory before rejecting a customer application.
              </p>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Asbestos sheet roof unsuitable for solar mounting..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectionReason.trim()}
                  onClick={() => executeAction('REJECT_LEAD', { reason: rejectionReason })}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: Request Info */}
        {requestInfoModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-1">Request Customer Information</h3>
              <p className="text-xs text-slate-500 mb-4">
                Specify what details or document updates the customer needs to submit.
              </p>
              <textarea
                rows={3}
                value={requestInfoNotes}
                onChange={(e) => setRequestInfoNotes(e.target.value)}
                placeholder="e.g. Electricity bill upload is blurred. Please provide a clear copy showing consumer ID..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRequestInfoModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!requestInfoNotes.trim()}
                  onClick={() => executeAction('REQUEST_INFO', { remarks: requestInfoNotes })}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white disabled:opacity-50"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 6: Advance Project Stage */}
        {projectStageModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-purple-900 mb-1">
                {projectActionPayload.title || 'Update Project Milestone'}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Update the official project execution record and append to status history.
              </p>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Milestone Stage *</label>
                  <select
                    value={projectActionPayload.projectStage}
                    onChange={(e) => setProjectActionPayload({ ...projectActionPayload, projectStage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="ADVANCE_PAYMENT_PENDING">1. Advance Payment Pending</option>
                    <option value="ADVANCE_PAYMENT_RECEIVED">2. Advance Payment Received</option>
                    <option value="INSTALLATION_SCHEDULED">3. Installation Scheduled</option>
                    <option value="INSTALLATION_STARTED">4. Installation in Progress / Started</option>
                    <option value="INSTALLATION_COMPLETED">5. Installation Completed</option>
                    <option value="INSPECTION_PENDING">6. Net Meter Inspection Pending</option>
                    <option value="INSPECTION_COMPLETED">7. Net Meter Inspection Completed & Passed</option>
                    <option value="SUBSIDY_APPLICATION_SUBMITTED">8. Subsidy Application Submitted</option>
                    <option value="SUBSIDY_PROCESSING">9. Subsidy Processing / DISCOM Verification</option>
                    <option value="SUBSIDY_CREDITED">10. Govt Subsidy Credited</option>
                    <option value="PROJECT_COMPLETED">11. Project Completed & Closed</option>
                  </select>
                </div>

                {projectActionPayload.projectStage === 'ADVANCE_PAYMENT_RECEIVED' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Advance Amount Received (₹) *</label>
                    <input
                      type="number"
                      value={projectActionPayload.paymentAmount}
                      onChange={(e) => setProjectActionPayload({ ...projectActionPayload, paymentAmount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                )}

                {projectActionPayload.projectStage === 'INSTALLATION_SCHEDULED' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Installation Target Date *</label>
                      <input
                        type="date"
                        value={projectActionPayload.scheduledDate}
                        onChange={(e) => setProjectActionPayload({ ...projectActionPayload, scheduledDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Assigned Installation Crew</label>
                      <input
                        type="text"
                        value={projectActionPayload.installerTeam}
                        onChange={(e) => setProjectActionPayload({ ...projectActionPayload, installerTeam: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                {projectActionPayload.projectStage === 'SUBSIDY_APPLICATION_SUBMITTED' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">National Portal Application Ref Number *</label>
                    <input
                      type="text"
                      value={projectActionPayload.portalRefNumber}
                      onChange={(e) => setProjectActionPayload({ ...projectActionPayload, portalRefNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {projectActionPayload.projectStage === 'SUBSIDY_CREDITED' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Disbursed Subsidy Amount (₹) *</label>
                    <input
                      type="number"
                      value={projectActionPayload.disbursedAmount}
                      onChange={(e) => setProjectActionPayload({ ...projectActionPayload, disbursedAmount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Milestone Remarks / Notes</label>
                  <textarea
                    rows={2}
                    value={projectActionPayload.remarks}
                    onChange={(e) => setProjectActionPayload({ ...projectActionPayload, remarks: e.target.value })}
                    placeholder="Enter milestone observations or reference details..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setProjectStageModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => executeAction('UPDATE_PROJECT_STAGE', projectActionPayload)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                >
                  Confirm Milestone Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
