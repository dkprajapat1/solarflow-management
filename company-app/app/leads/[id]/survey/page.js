'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CompanyLayout from '@/components/CompanyLayout';
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileText,
  User,
  Home,
  Zap,
} from 'lucide-react';

export default function SiteSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [surveyData, setSurveyData] = useState({
    actualRoofArea: 480,
    usableRoofArea: 420,
    roofCondition: 'Good',
    shadowFreeArea: 400,
    installationFeasibility: 'Highly Feasible',
    recommendedSystemCapacity: 3.5,
    surveyRemarks: 'South-facing unobstructed RCC roof with strong load-bearing capacity. Standard elevated structure recommended.',
    surveyObservations: 'Grid connection pole is located 12m from meter point. Three-phase service available with adequate earthing pit space.',
  });

  useEffect(() => {
    if (!id) return;
    fetch(`/api/leads/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.application) {
          setLead(data.application);
          if (data.survey) {
            setSurveyData({
              actualRoofArea: data.survey.actualRoofArea || 500,
              usableRoofArea: data.survey.usableRoofArea || 420,
              roofCondition: data.survey.roofCondition || 'Good',
              shadowFreeArea: data.survey.shadowFreeArea || 400,
              installationFeasibility: data.survey.installationFeasibility || 'Highly Feasible',
              recommendedSystemCapacity: data.survey.recommendedSystemCapacity || 3.5,
              surveyRemarks: data.survey.surveyRemarks || '',
              surveyObservations: data.survey.surveyObservations || '',
            });
          } else {
            const reported = data.application.propertyDetails?.availableRoofArea || 500;
            setSurveyData((prev) => ({
              ...prev,
              actualRoofArea: reported,
              usableRoofArea: Math.round(reported * 0.85),
              shadowFreeArea: Math.round(reported * 0.8),
              recommendedSystemCapacity: data.application.preliminaryEstimate?.recommendedCapacity || 3.5,
            }));
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${id}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record site survey');

      // Navigate to Quotation builder
      router.push(`/leads/${id}/quotation`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !lead) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-emerald-600 mb-3" />
            <p className="text-sm font-medium text-slate-500">Loading site survey inspection data...</p>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  const estimatedPotentialKw = (surveyData.usableRoofArea / 100).toFixed(1);

  return (
    <CompanyLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/leads/${id}`}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Application Overview</span>
          </Link>
          <span className="text-xs font-mono text-slate-500">
            Application: <strong className="text-slate-800">{lead.applicationId}</strong>
          </span>
        </div>

        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 mb-2">
                <Layers className="h-3.5 w-3.5" />
                <span>Stage 2 &bull; On-Site Technical Inspection</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Record Site Visit & Technical Survey
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter precise physical measurements and structural feasibility observations to mark the site visit as completed.
              </p>
            </div>
            {lead.siteVisit?.scheduledDate && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">
                    Scheduled: {new Date(lead.siteVisit.scheduledDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Slot: {lead.siteVisit.timeSlot || 'Morning'} &bull; Assigned: {lead.siteVisit.assignedTo || 'Field Engineer'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Context Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
            <div className="flex items-center space-x-2 text-slate-600">
              <User className="h-4 w-4 text-slate-400" />
              <span className="truncate">{lead.personalDetails?.fullName}</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <Home className="h-4 w-4 text-slate-400" />
              <span className="truncate">{lead.personalDetails?.city || 'City N/A'}</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <Zap className="h-4 w-4 text-slate-400" />
              <span>Customer Area: {lead.propertyDetails?.availableRoofArea || 0} sq ft</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <FileText className="h-4 w-4 text-slate-400" />
              <span>Estimated: {lead.preliminaryEstimate?.recommendedCapacity || 3} kW</span>
            </div>
          </div>
        </div>

        {/* Workflow Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-900">
          <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Stage Progression:</strong> Submitting this survey report will officially transition the site visit status to <span className="font-semibold text-blue-800">COMPLETED</span> and advance the lead to <span className="font-semibold text-blue-800">Stage 3 (Final Quotation Preparation)</span>.
          </div>
        </div>

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Physical Roof Measurements
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Measured Roof Area (sq. ft.) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={surveyData.actualRoofArea}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, actualRoofArea: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Full boundary dimension</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Usable Unobstructed Area (sq. ft.) *
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  value={surveyData.usableRoofArea}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, usableRoofArea: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 font-medium"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Excluding tanks & vents</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shadow-Free Area (sq. ft.) *
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  value={surveyData.shadowFreeArea}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, shadowFreeArea: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">9 AM &ndash; 4 PM solar window</span>
              </div>
            </div>

            {/* Capacity Estimation Hint */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Estimated Max Solar Capacity based on Usable Area (~100 sq ft / kW):</span>
              <strong className="text-slate-900 font-mono text-sm">{estimatedPotentialKw} kWp</strong>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              2. Structural Condition & Feasibility
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roof Structural Condition *
                </label>
                <select
                  value={surveyData.roofCondition}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, roofCondition: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 bg-white"
                >
                  <option value="Excellent">Excellent &bull; Reinforced Concrete (RCC), Pristine slab</option>
                  <option value="Good">Good &bull; Stable, load-bearing concrete/sheet roof</option>
                  <option value="Needs Minor Repair">Needs Minor Repair &bull; Waterproofing/patching needed</option>
                  <option value="Unsuitable">Unsuitable &bull; Weak structure / heavy degradation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Installation Feasibility Classification *
                </label>
                <select
                  value={surveyData.installationFeasibility}
                  onChange={(e) =>
                    setSurveyData({ ...surveyData, installationFeasibility: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 bg-white"
                >
                  <option value="Highly Feasible">Highly Feasible &bull; Standard anchor/ballast mount</option>
                  <option value="Feasible with Structure Elevation">Feasible with Structure Elevation &bull; Elevated 1.5m - 2.5m</option>
                  <option value="Feasible with Shading Mitigation">Feasible with Module Optimization</option>
                  <option value="Not Recommended">Not Recommended &bull; Severe parapet/building obstruction</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Final Recommended System Capacity (kW) *
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={50}
                    required
                    value={surveyData.recommendedSystemCapacity}
                    onChange={(e) =>
                      setSurveyData({
                        ...surveyData,
                        recommendedSystemCapacity: Number(e.target.value),
                      })
                    }
                    className="w-48 px-3 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <span className="text-xs text-slate-500">
                    Recommended for applicant based on sanctioned load ({lead.electricityDetails?.sanctionedLoad || 5} kW) and usable roof area.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              3. Observations & Field Notes
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Electrical & Grid Connection Observations
              </label>
              <textarea
                rows={2}
                value={surveyData.surveyObservations}
                onChange={(e) =>
                  setSurveyData({ ...surveyData, surveyObservations: e.target.value })
                }
                placeholder="E.g., Grid connection pole distance, DISCOM meter location, earthing pit space..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Surveyor Remarks & Final Recommendations *
              </label>
              <textarea
                rows={3}
                required
                value={surveyData.surveyRemarks}
                onChange={(e) =>
                  setSurveyData({ ...surveyData, surveyRemarks: e.target.value })
                }
                placeholder="Detailed notes regarding roof orientation, structural integrity, structure type..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Link
              href={`/leads/${id}`}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{saving ? 'Completing Site Visit...' : 'Complete Site Visit & Generate Quotation'}</span>
            </button>
          </div>
        </form>
      </div>
    </CompanyLayout>
  );
}
