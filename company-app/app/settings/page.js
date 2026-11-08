'use client';

import { useState, useEffect } from 'react';
import CompanyLayout from '@/components/CompanyLayout';
import { Settings, Save, CheckCircle2, ShieldCheck, DollarSign, Info } from 'lucide-react';

export default function SettingsPage() {
  const [pricing, setPricing] = useState({
    name: 'Standard Commercial/Residential EPC Slabs',
    panelRatePerKw: 32000,
    inverterRatePerKw: 12000,
    structureRatePerKw: 6000,
    installationRatePerKw: 5000,
    electricalsRatePerKw: 5000,
  });

  const [subsidy, setSubsidy] = useState({
    schemeName: 'PM Surya Ghar: Muft Bijli Yojana',
    slabs: [
      { minKw: 0, maxKw: 1, subsidyAmount: 30000, description: '₹30,000 for 1 kW' },
      { minKw: 1, maxKw: 2, subsidyAmount: 60000, description: '₹60,000 for 2 kW' },
      { minKw: 2, maxKw: 10, subsidyAmount: 78000, description: '₹78,000 cap for 3 kW and above' },
    ],
    maxSubsidyAmount: 78000,
    effectiveFrom: '2024-01-01',
    effectiveUntil: '2030-12-31',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.pricing) setPricing(data.pricing);
          if (data.subsidy) setSubsidy(data.subsidy);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing, subsidy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompanyLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Settings className="h-6 w-6 text-emerald-600" />
            <span>Pricing Rules & Central Subsidy Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure system turnkey rates, default EPC hardware component costs, and government subsidy slabs.
          </p>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Settings and subsidy slabs successfully saved and activated in database!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Hardware EPC Slabs Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>Turnkey Hardware & EPC Pricing Rates (per kW)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Solar PV Module Rate (₹/kW)
                </label>
                <input
                  type="number"
                  value={pricing.panelRatePerKw}
                  onChange={(e) => setPricing({ ...pricing, panelRatePerKw: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Inverter Rate (₹/kW)
                </label>
                <input
                  type="number"
                  value={pricing.inverterRatePerKw}
                  onChange={(e) => setPricing({ ...pricing, inverterRatePerKw: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Mounting Structure (₹/kW)
                </label>
                <input
                  type="number"
                  value={pricing.structureRatePerKw}
                  onChange={(e) => setPricing({ ...pricing, structureRatePerKw: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Electricals & Cabling (₹/kW)
                </label>
                <input
                  type="number"
                  value={pricing.electricalsRatePerKw}
                  onChange={(e) => setPricing({ ...pricing, electricalsRatePerKw: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Installation & Labor (₹/kW)
                </label>
                <input
                  type="number"
                  value={pricing.installationRatePerKw}
                  onChange={(e) => setPricing({ ...pricing, installationRatePerKw: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Government Subsidy Scheme Rules */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Government Subsidy Scheme Rules</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Scheme Title</label>
                <input
                  type="text"
                  value={subsidy.schemeName}
                  onChange={(e) => setSubsidy({ ...subsidy, schemeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Maximum Subsidy Cap (₹)</label>
                <input
                  type="number"
                  value={subsidy.maxSubsidyAmount}
                  onChange={(e) => setSubsidy({ ...subsidy, maxSubsidyAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-emerald-700 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Info className="h-3.5 w-3.5 text-slate-500" />
                <span>Active Slabs (PM Surya Ghar Standards)</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-700">Up to 1 kW System:</span>
                  <strong className="text-emerald-700 font-mono">₹30,000 direct subsidy</strong>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-700">Between 1 kW and 2 kW:</span>
                  <strong className="text-emerald-700 font-mono">₹60,000 direct subsidy</strong>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-700">3 kW and Above:</span>
                  <strong className="text-emerald-700 font-mono">₹78,000 maximum cap</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Updating Settings...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </CompanyLayout>
  );
}
