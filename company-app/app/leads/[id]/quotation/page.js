'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import CompanyLayout from '@/components/CompanyLayout';
import {
  FileText,
  ArrowLeft,
  Printer,
  Sparkles,
  Save,
  CheckCircle2,
  DollarSign,
  Sun,
  ShieldCheck,
  Zap,
  Clock,
  Send,
  Eye,
  Edit3,
} from 'lucide-react';
import { calculateSubsidy } from '@/lib/solarCalculations.js';

export default function QuotationBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [lead, setLead] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [existingQuotation, setExistingQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'

  const [capacityKw, setCapacityKw] = useState(3.5);
  const [panelModel, setPanelModel] = useState('Mono PERC Bifacial 550W Tier-1 (DCR Compliant)');
  const [panelCount, setPanelCount] = useState(7);
  const [inverterModel, setInverterModel] = useState('Grid-Tied String Inverter (Wi-Fi, IP65, Dual MPPT)');
  const [quotationStatus, setQuotationStatus] = useState('Sent to customer');
  const [revisionNotes, setRevisionNotes] = useState('');

  const [pricing, setPricing] = useState({
    solarPanels: 112000,
    inverter: 42000,
    mountingStructure: 21000,
    cablingAndElectricals: 17500,
    installationAndCommissioning: 17500,
    netMeteringAndLiaisoning: 5000,
  });

  const [stateSubsidy, setStateSubsidy] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/leads/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.application) {
          setLead(data.application);
          if (data.survey) {
            setSurvey(data.survey);
            const cap = data.survey.recommendedSystemCapacity || 3.5;
            setCapacityKw(cap);
            setPanelCount(Math.ceil((cap * 1000) / 550));
            setPricing({
              solarPanels: Math.round(cap * 32000),
              inverter: Math.round(cap * 12000),
              mountingStructure: Math.round(cap * 6000),
              cablingAndElectricals: Math.round(cap * 5000),
              installationAndCommissioning: Math.round(cap * 5000),
              netMeteringAndLiaisoning: 5000,
            });
          }
          if (data.quotation) {
            setExistingQuotation(data.quotation);
            if (data.quotation.systemDetails) {
              setCapacityKw(data.quotation.systemDetails.capacityKw || 3.5);
              setPanelModel(data.quotation.systemDetails.panelModel || '');
              setPanelCount(data.quotation.systemDetails.panelCount || 7);
              setInverterModel(data.quotation.systemDetails.inverterModel || '');
            }
            if (data.quotation.pricingBreakdown) {
              setPricing({
                solarPanels: data.quotation.pricingBreakdown.solarPanels || 112000,
                inverter: data.quotation.pricingBreakdown.inverter || 42000,
                mountingStructure: data.quotation.pricingBreakdown.mountingStructure || 21000,
                cablingAndElectricals: data.quotation.pricingBreakdown.cablingAndElectricals || 17500,
                installationAndCommissioning: data.quotation.pricingBreakdown.installationAndCommissioning || 17500,
                netMeteringAndLiaisoning: data.quotation.pricingBreakdown.netMeteringAndLiaisoning || 5000,
              });
            }
            if (data.quotation.status) {
              setQuotationStatus(data.quotation.status);
            }
            if (data.quotation.revisionNotes) {
              setRevisionNotes(data.quotation.revisionNotes);
            }
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const grossTotal =
    (pricing.solarPanels || 0) +
    (pricing.inverter || 0) +
    (pricing.mountingStructure || 0) +
    (pricing.cablingAndElectricals || 0) +
    (pricing.installationAndCommissioning || 0) +
    (pricing.netMeteringAndLiaisoning || 0);

  const centralSubsidy = calculateSubsidy(capacityKw);
  const totalSubsidy = centralSubsidy + (Number(stateSubsidy) || 0);
  const netCustomerCost = Math.max(0, grossTotal - totalSubsidy);

  const annualGenerationUnits = Math.round(capacityKw * 1400);
  const estimatedAnnualSavings = Math.round(annualGenerationUnits * 7.5);
  const estimatedPaybackYears =
    estimatedAnnualSavings > 0
      ? Math.round((netCustomerCost / estimatedAnnualSavings) * 10) / 10
      : 0;

  const handleCapacityChange = (newCap) => {
    const cap = Math.max(1, Number(newCap) || 1);
    setCapacityKw(cap);
    setPanelCount(Math.ceil((cap * 1000) / 550));
    setPricing({
      solarPanels: Math.round(cap * 32000),
      inverter: Math.round(cap * 12000),
      mountingStructure: Math.round(cap * 6000),
      cablingAndElectricals: Math.round(cap * 5000),
      installationAndCommissioning: Math.round(cap * 5000),
      netMeteringAndLiaisoning: 5000,
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = {
        capacityKw,
        panelModel,
        panelCount,
        inverterModel,
        pricingBreakdown: {
          ...pricing,
          grossTotal,
          taxes: 0,
        },
        subsidy: {
          centralSubsidy,
          stateSubsidy: Number(stateSubsidy) || 0,
          totalSubsidy,
        },
        netCustomerCost,
        metrics: {
          annualGenerationUnits,
          estimatedAnnualSavings,
          estimatedPaybackYears,
        },
        status: quotationStatus,
        revisionNotes,
      };

      const res = await fetch(`/api/leads/${id}/quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save quotation');

      alert(`Official Quotation successfully saved with status: "${quotationStatus}"!`);
      router.push(`/leads/${id}`);
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
            <p className="text-sm font-medium text-slate-500">Loading quotation configuration...</p>
          </div>
        </div>
      </CompanyLayout>
    );
  }

  const quotationDocNumber = existingQuotation?.quotationNumber || `QT-${lead.applicationId?.slice(-6) || '2025'}-01`;

  return (
    <CompanyLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation Breadcrumbs & Top Bar (hidden during print) */}
        <div className="print:hidden flex items-center justify-between">
          <Link
            href={`/leads/${id}`}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Application Overview</span>
          </Link>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'editor' ? 'preview' : 'editor')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {activeTab === 'editor' ? (
                <>
                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                  <span>Preview Proposal Sheet</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Edit Pricing / Sizing</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Controls (hidden during print) */}
        <div className="print:hidden flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'editor'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>1. Quotation Builder & Cost Breakdown</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'preview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>2. Official Customer Proposal Document</span>
          </button>
        </div>

        {/* TAB 1: INTERACTIVE BUILDER (hidden during print) */}
        {activeTab === 'editor' && (
          <form onSubmit={handleSubmit} className="print:hidden space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 mb-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Stage 3 &bull; Commercial Quotation Preparation</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Turnkey Rooftop Solar Quotation
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Client: <strong className="text-slate-800">{lead.personalDetails?.fullName}</strong> &bull; Location: {lead.personalDetails?.city} &bull; Usable Roof Area: {survey?.usableRoofArea || lead.propertyDetails?.availableRoofArea || 0} sq ft
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-right">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block tracking-wider">
                    Net Customer Capital Outlay
                  </span>
                  <span className="text-2xl font-bold text-emerald-700">
                    ₹{netCustomerCost.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5">
                    Gross: ₹{grossTotal.toLocaleString('en-IN')} &bull; Subsidy: -₹{totalSubsidy.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Status and Versioning Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quotation Status Lifecycle *
                </label>
                <select
                  value={quotationStatus}
                  onChange={(e) => setQuotationStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900"
                >
                  <option value="Draft">Draft (Internal Review)</option>
                  <option value="Sent to customer">Sent to customer (Pending Customer Approval)</option>
                  <option value="Approved">Approved (Customer Accepted)</option>
                  <option value="Rejected">Rejected (Customer Declined)</option>
                  <option value="Revised">Revised (Modified Pricing)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">Current state visible to company and customer</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revision Notes / Special Customer Terms
                </label>
                <input
                  type="text"
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="E.g., Includes 5-year comprehensive maintenance & lightning arrestor package"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>

            {/* System Technical Configuration */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>1. System Hardware Specifications</span>
                <span className="text-xs font-normal text-slate-500">Tier-1 DCR Equipment</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Rated Capacity (kW) *
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={50}
                    value={capacityKw}
                    onChange={(e) => handleCapacityChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Survey recommended: {survey?.recommendedSystemCapacity || 3.5} kW
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Solar Panel Model & Wattage *
                  </label>
                  <input
                    type="text"
                    value={panelModel}
                    onChange={(e) => setPanelModel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Number of PV Modules *
                  </label>
                  <input
                    type="number"
                    value={panelCount}
                    onChange={(e) => setPanelCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inverter Model, Phase & Warranty *
                  </label>
                  <input
                    type="text"
                    value={inverterModel}
                    onChange={(e) => setInverterModel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Itemized Cost Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                2. Itemized Cost Breakdown (Turnkey EPC)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    1. Solar PV Modules (₹)
                  </label>
                  <input
                    type="number"
                    value={pricing.solarPanels}
                    onChange={(e) => setPricing({ ...pricing, solarPanels: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500">Tier-1 DCR ALMM listed bifacial modules</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    2. Grid-tied Inverter (₹)
                  </label>
                  <input
                    type="number"
                    value={pricing.inverter}
                    onChange={(e) => setPricing({ ...pricing, inverter: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500">Wi-Fi monitorable with dual MPPT</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    3. Hot-Dip Galvanized Mounting Structure (₹)
                  </label>
                  <input
                    type="number"
                    value={pricing.mountingStructure}
                    onChange={(e) => setPricing({ ...pricing, mountingStructure: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500">150 km/h wind resistance rated structure</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    4. Cabling, ACDB/DCDB & Switchgear (₹)
                  </label>
                  <input
                    type="number"
                    value={pricing.cablingAndElectricals}
                    onChange={(e) => setPricing({ ...pricing, cablingAndElectricals: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500">UV resistant solar cables, SPD, isolators & fuses</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    5. Installation, Earthing & Commissioning (₹)
                  </label>
                  <input
                    type="number"
                    value={pricing.installationAndCommissioning}
                    onChange={(e) =>
                      setPricing({ ...pricing, installationAndCommissioning: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500">Certified technicians & copper chemical earthing</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    6. DISCOM Net-Metering & Liaisoning (₹)
                  </label>
                  <input
                    type="number"
                    value={pricing.netMeteringAndLiaisoning}
                    onChange={(e) =>
                      setPricing({ ...pricing, netMeteringAndLiaisoning: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500">Documentation, approval, meter test & synchronization</span>
                </div>
              </div>
            </div>

            {/* Subsidies & Net Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                3. Subsidies & Commercial Summary
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800">Subsidy Entitlements</div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Central Subsidy (PM Surya Ghar DBT):</span>
                    <strong className="text-emerald-700 font-mono">₹{centralSubsidy.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>State / Discom Additional Subsidy:</span>
                    <div className="flex items-center space-x-1">
                      <span>₹</span>
                      <input
                        type="number"
                        value={stateSubsidy}
                        onChange={(e) => setStateSubsidy(Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded border border-slate-300 text-right font-mono"
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-800">
                    <span>Total Subsidy Relief:</span>
                    <span className="text-emerald-700 font-mono">-₹{totalSubsidy.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800">Key Customer ROI Metrics</div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Est. Annual Generation:</span>
                    <strong className="text-slate-900 font-mono">{annualGenerationUnits.toLocaleString('en-IN')} units (kWh)</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Est. Annual Bill Savings:</span>
                    <strong className="text-emerald-700 font-mono">₹{estimatedAnnualSavings.toLocaleString('en-IN')} / yr</strong>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-800">
                    <span>Estimated Payback Horizon:</span>
                    <span className="text-slate-900 font-mono">{estimatedPaybackYears} Years</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <Link
                href={`/leads/${id}`}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
                >
                  View Printable Sheet
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : `Save Quotation (${quotationStatus})`}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2 & PRINT VIEW: FORMAL COMMERCIAL PROPOSAL */}
        {(activeTab === 'preview' || true) && (
          <div className={`${activeTab !== 'preview' ? 'hidden print:block' : 'block'} bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 print:p-0 print:border-none print:shadow-none space-y-8 text-slate-900`}>
            {/* Proposal Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white print:bg-emerald-600">
                    <Sun className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-black tracking-tight text-slate-900">
                    SolarFlow Technologies
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Govt. MNRE & DISCOM Empanelled Rooftop Solar EPC Contractor
                </p>
                <p className="text-[11px] text-slate-400">
                  Email: operations@solarflow.in &bull; Helpline: 1800-SOLAR-FLOW
                </p>
              </div>

              <div className="text-right space-y-1">
                <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-mono text-xs font-bold border border-slate-200">
                  {quotationDocNumber}
                </span>
                <div className="text-xs text-slate-500">
                  Date: {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-xs text-slate-500">
                  Valid Until: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-xs font-bold text-emerald-700">
                  Status: {quotationStatus}
                </div>
              </div>
            </div>

            {/* Bill To & Property Details */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs print:bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Client / Site Details
                </span>
                <div className="font-bold text-slate-900 text-sm">{lead.personalDetails?.fullName}</div>
                <div className="text-slate-600">{lead.personalDetails?.address || 'Site Address'}</div>
                <div className="text-slate-600">{lead.personalDetails?.city || ''} {lead.personalDetails?.pincode ? `- ${lead.personalDetails.pincode}` : ''}</div>
                <div className="text-slate-600 mt-1">Phone: {lead.personalDetails?.phone}</div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Technical Connection Baseline
                </span>
                <div className="text-slate-700"><span className="font-semibold">DISCOM:</span> {lead.electricityDetails?.discom || 'State Electricity Distribution'}</div>
                <div className="text-slate-700"><span className="font-semibold">Consumer No:</span> {lead.electricityDetails?.consumerNumber || 'N/A'}</div>
                <div className="text-slate-700"><span className="font-semibold">Sanctioned Load:</span> {lead.electricityDetails?.sanctionedLoad || 5} kW</div>
                <div className="text-slate-700"><span className="font-semibold">Usable Shadow-Free Roof:</span> {survey?.usableRoofArea || lead.propertyDetails?.availableRoofArea || 0} sq ft</div>
              </div>
            </div>

            {/* Technical System Overview Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                System Specification Matrix
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Component / Spec</th>
                      <th className="p-3">Specification Detail</th>
                      <th className="p-3 text-right">Qty / Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Total System Capacity</td>
                      <td className="p-3 text-slate-600">On-Grid Rooftop Solar Photovoltaic Plant</td>
                      <td className="p-3 text-right font-bold text-slate-900">{capacityKw} kWp</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Solar PV Modules</td>
                      <td className="p-3 text-slate-600">{panelModel}</td>
                      <td className="p-3 text-right font-medium">{panelCount} Units</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Solar Inverter</td>
                      <td className="p-3 text-slate-600">{inverterModel}</td>
                      <td className="p-3 text-right font-medium">1 Unit</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Mounting Structure</td>
                      <td className="p-3 text-slate-600">Hot-Dip Galvanized Iron (HDG) Elevated Structure (Tilt 15&deg;&ndash;25&deg;)</td>
                      <td className="p-3 text-right font-medium">Turnkey Set</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Balance of System (BOS)</td>
                      <td className="p-3 text-slate-600">Copper Chemical Earthing, Lightning Arrestor, DCDB/ACDB, Solar Cables</td>
                      <td className="p-3 text-right font-medium">Complete</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Warranty Protection</td>
                      <td className="p-3 text-slate-600">25 Years Solar Module Performance &bull; 8 Years Inverter &bull; 5 Years Workmanship</td>
                      <td className="p-3 text-right font-medium">Comprehensive</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill of Quantities / Pricing Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                Commercial Bill of Quantities (BOQ) & Pricing Schedule
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Description of Work / Hardware</th>
                      <th className="p-3 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 text-slate-400 font-mono">1</td>
                      <td className="p-3 text-slate-800 font-medium">Solar PV Modules (Tier-1 DCR ALMM listed)</td>
                      <td className="p-3 text-right font-mono">₹{pricing.solarPanels.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-400 font-mono">2</td>
                      <td className="p-3 text-slate-800 font-medium">Solar On-Grid Inverter with Wi-Fi Cloud Logging</td>
                      <td className="p-3 text-right font-mono">₹{pricing.inverter.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-400 font-mono">3</td>
                      <td className="p-3 text-slate-800 font-medium">HDG Solar Module Mounting Hardware & Fasteners</td>
                      <td className="p-3 text-right font-mono">₹{pricing.mountingStructure.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-400 font-mono">4</td>
                      <td className="p-3 text-slate-800 font-medium">DC/AC Cabling, Conduit, Switchgear & Earthing Kits</td>
                      <td className="p-3 text-right font-mono">₹{pricing.cablingAndElectricals.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-400 font-mono">5</td>
                      <td className="p-3 text-slate-800 font-medium">Civil Foundation, Electrical Installation & Safety Commissioning</td>
                      <td className="p-3 text-right font-mono">₹{pricing.installationAndCommissioning.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-400 font-mono">6</td>
                      <td className="p-3 text-slate-800 font-medium">DISCOM Net-Meter Liaisoning, Plant Drawing & Synchronization</td>
                      <td className="p-3 text-right font-mono">₹{pricing.netMeteringAndLiaisoning.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                    <tr>
                      <td colSpan={2} className="p-3 text-right font-bold text-slate-800">
                        Gross Turnkey EPC Cost:
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 font-mono">
                        ₹{grossTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    <tr className="text-emerald-700">
                      <td colSpan={2} className="p-2 text-right font-bold">
                        Central Financial Subsidy (PM Surya Ghar Direct DBT):
                      </td>
                      <td className="p-2 text-right font-bold font-mono">
                        -₹{centralSubsidy.toLocaleString('en-IN')}
                      </td>
                    </tr>
                    {stateSubsidy > 0 && (
                      <tr className="text-emerald-700">
                        <td colSpan={2} className="p-2 text-right font-bold">
                          State Government Direct Subsidy:
                        </td>
                        <td className="p-2 text-right font-bold font-mono">
                          -₹{Number(stateSubsidy).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50 text-emerald-900 border-t-2 border-emerald-300">
                      <td colSpan={2} className="p-3 text-right font-black text-sm">
                        NET CAPITAL OUTLAY PAYABLE BY CUSTOMER:
                      </td>
                      <td className="p-3 text-right font-black text-base font-mono text-emerald-700">
                        ₹{netCustomerCost.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Financial ROI Highlights */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 print:bg-slate-50">
                <span className="text-slate-500 block text-[11px]">Est. Annual Solar Output</span>
                <span className="font-bold text-slate-900 text-sm">{annualGenerationUnits.toLocaleString('en-IN')} kWh / Year</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 print:bg-slate-50">
                <span className="text-slate-500 block text-[11px]">Est. Electricity Bill Savings</span>
                <span className="font-bold text-emerald-700 text-sm">₹{estimatedAnnualSavings.toLocaleString('en-IN')} / Year</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 print:bg-slate-50">
                <span className="text-slate-500 block text-[11px]">Estimated Payback Period</span>
                <span className="font-bold text-slate-900 text-sm">{estimatedPaybackYears} Years</span>
              </div>
            </div>

            {/* Terms and Signature */}
            <div className="pt-4 border-t border-slate-200 space-y-4 text-[11px] text-slate-600">
              <div className="space-y-1">
                <div className="font-bold text-slate-800">Commercial & Installation Terms:</div>
                <p>1. Payment Milestones: 20% advance upon contract signing, 60% upon material delivery at site, 20% post-commissioning & net-meter synchronization.</p>
                <p>2. Subsidy Disbursement: PM Surya Ghar subsidy is credited directly to customer bank account via DBT post DISCOM inspection.</p>
                <p>3. This proposal is valid for 30 calendar days from the date of issue.</p>
              </div>

              <div className="pt-8 flex justify-between items-end">
                <div className="space-y-8">
                  <div className="border-t border-slate-400 w-48 text-center pt-1 text-slate-500">
                    Customer Signature & Date
                  </div>
                </div>

                <div className="space-y-8 text-right">
                  <div className="border-t border-slate-400 w-52 text-center pt-1 text-slate-500">
                    Authorized Signatory & Stamp<br />
                    <span className="font-bold text-slate-800">SolarFlow Technologies Pvt Ltd</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}
