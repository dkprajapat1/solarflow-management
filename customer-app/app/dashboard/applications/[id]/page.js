'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Home,
  Zap,
  ArrowLeft,
  Download,
  Sparkles,
} from 'lucide-react';

const TIMELINE_STAGES = [
  { key: 'SUBMITTED', title: 'Application Submitted', desc: 'Application received and registered in SolarFlow system.' },
  { key: 'BILL_VERIFIED', title: 'Bill Verification', desc: 'Electricity utility bill verified via OCR and cross-referenced.' },
  { key: 'COMPANY_REVIEW', title: 'Company Review', desc: 'Engineering team assessing feasibility and grid connectivity.' },
  { key: 'SITE_SURVEY', title: 'Site Survey', desc: 'Physical rooftop shadow analysis and structural measurement.' },
  { key: 'FINAL_QUOTATION', title: 'Final Quotation', desc: 'Official bill of materials and customized technical design.' },
  { key: 'CUSTOMER_APPROVAL', title: 'Customer Approval', desc: 'Customer review and sign-off on equipment specifications.' },
  { key: 'ADVANCE_PAYMENT', title: 'Advance Payment', desc: 'Initial token / procurement payment processed.' },
  { key: 'INSTALLATION_STARTED', title: 'Installation Started', desc: 'Solar modules, inverters and structure mounting in progress.' },
  { key: 'INSTALLATION_COMPLETED', title: 'Installation Completed', desc: 'System commissioned and net-metering grid synchronized.' },
  { key: 'SUBSIDY_PROCESSING', title: 'Subsidy Processing', desc: 'PM Surya Ghar national portal inspection and documentation.' },
  { key: 'SUBSIDY_CREDITED', title: 'Subsidy Credited', desc: 'Direct Benefit Transfer (DBT) credited to customer bank account.' },
];

export default function ApplicationTrackingPage() {
  const params = useParams();
  const applicationId = params?.id;

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!applicationId) return;

    fetch(`/api/applications/${applicationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.application) {
          setApplication(data.application);
        } else {
          setError(data.error || 'Failed to load application');
        }
      })
      .catch((err) => {
        setError('Error loading application tracking details');
      })
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-8">
          <div className="text-center">
            <div className="inline-block animate-spin h-9 w-9 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm text-slate-500 font-medium">
              Loading application {applicationId}...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="p-8 bg-white rounded-2xl border border-slate-200">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-3" />
            <h2 className="text-xl font-bold text-slate-900">Application Not Found</h2>
            <p className="text-sm text-slate-500 mt-1">{error || 'Could not find the requested application.'}</p>
            <div className="mt-6">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStageIndex = TIMELINE_STAGES.findIndex(
    (stage) => stage.key === application.status
  );
  const activeIdx = currentStageIndex >= 0 ? currentStageIndex : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Print Application</span>
          </button>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                {application.applicationId}
              </h1>
              <StatusBadge status={application.status} />
            </div>
            <p className="text-xs text-slate-500">
              Submitted on{' '}
              <strong className="text-slate-700">
                {new Date(application.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>{' '}
              • Priority: <span className="font-semibold text-emerald-700">{application.priority || 'Medium'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="block text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                System Capacity
              </span>
              <span className="text-lg font-black text-emerald-900">
                {application.preliminaryEstimate?.recommendedCapacity || 3} kW
              </span>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Est. Subsidy
              </span>
              <span className="text-lg font-black text-emerald-700">
                ₹{application.preliminaryEstimate?.subsidyAmount?.toLocaleString('en-IN') || '78,000'}
              </span>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Est. Net Cost
              </span>
              <span className="text-lg font-black text-slate-900">
                ₹{application.preliminaryEstimate?.netInstallationCost?.toLocaleString('en-IN') || '1,02,000'}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 text-white shadow-md">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-200 flex-shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-emerald-100 uppercase tracking-wider">
                Current Status Update & Next Steps
              </h3>
              <p className="text-sm text-white font-medium">
                {application.companyRemarks || 'Your application has been received and registered. Our engineering desk will schedule a rooftop physical survey.'}
              </p>
              <p className="text-xs text-emerald-200/80 pt-1">
                Next Milestone: Site survey inspection with certified SolarFlow technician.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Project Execution Timeline (11 Stages)
            </h2>
            <p className="text-xs text-slate-500">
              Track real-time progress through procurement, site survey, DISCOM liaisoning, and subsidy disbursement.
            </p>
          </div>

          <div className="relative">
            <div className="space-y-6">
              {TIMELINE_STAGES.map((stage, idx) => {
                const isPassed = idx < activeIdx;
                const isCurrent = idx === activeIdx;

                return (
                  <div key={stage.key} className="flex items-start group">
                    <div className="flex flex-col items-center mr-4">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isPassed
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : isCurrent
                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 animate-pulse'
                            : 'bg-slate-100 text-slate-400 border border-slate-300'
                        }`}
                      >
                        {isPassed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      {idx < TIMELINE_STAGES.length - 1 && (
                        <div
                          className={`w-0.5 h-12 my-1 transition-colors ${
                            isPassed ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>

                    <div className="pt-1 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <h4
                          className={`text-sm font-bold ${
                            isCurrent
                              ? 'text-emerald-700'
                              : isPassed
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {stage.title}
                          {isCurrent && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                              Active Stage
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-slate-400 mt-0.5 sm:mt-0">
                          Stage {idx + 1} of 11
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-0.5 ${
                          isCurrent
                            ? 'text-slate-700 font-medium'
                            : isPassed
                            ? 'text-slate-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Home className="h-4 w-4 text-emerald-600" />
              <span>Customer & Property</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Applicant Name:</span>
                <strong className="text-slate-800">
                  {application.personalDetails?.fullName}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Mobile & Email:</span>
                <span className="text-slate-800">
                  {application.personalDetails?.mobile} • {application.personalDetails?.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Installation Address:</span>
                <span className="text-slate-800">
                  {application.personalDetails?.address}, {application.personalDetails?.city},{' '}
                  {application.personalDetails?.state} - {application.personalDetails?.pincode}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block">Property Details:</span>
                <span className="text-slate-800 font-medium">
                  {application.propertyDetails?.propertyType} ({application.propertyDetails?.ownership}) •{' '}
                  {application.propertyDetails?.roofType} Roof •{' '}
                  {application.propertyDetails?.availableRoofArea} sq. ft.
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>Electricity & OCR Verification</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Consumer Account Number:</span>
                <strong className="font-mono text-slate-900">
                  {application.electricityDetails?.consumerNumber}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Tariff & Sanctioned Load:</span>
                <span className="text-slate-800">
                  {application.electricityDetails?.tariffCategory} •{' '}
                  {application.electricityDetails?.sanctionedLoad} kW Load
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Monthly Consumption & Bill:</span>
                <span className="text-slate-800">
                  {application.electricityDetails?.averageMonthlyUnits} units • ₹
                  {application.electricityDetails?.monthlyBill?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block">OCR Verification Status:</span>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">
                    {application.verificationStatus?.status || 'VERIFIED'}
                  </span>
                  <span className="text-slate-500">
                    {application.ocrData?.confidence || 85}% OCR confidence
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Required Documents</span>
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Electricity Bill Uploaded</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-700">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>Aadhaar / ID Proof (Survey verification)</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-700">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>Rooftop Ownership Document / Tax Receipt</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-700">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span>Cancelled Cheque (for direct subsidy DBT credit)</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
