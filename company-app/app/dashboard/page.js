'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CompanyLayout from '@/components/CompanyLayout';
import {
  Users,
  FileText,
  Clock,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Wrench,
  Sun,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export default function CompanyDashboard() {
  const [data, setData] = useState({ applications: [], metrics: {} });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    setLoading(true);
    fetch('/api/leads')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = data.metrics || {};
  const recentLeads = (data.applications || []).slice(0, 8);

  const metricCards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads ?? 0,
      subtext: 'All registered customer applications',
      icon: Users,
      color: 'text-slate-700',
      bg: 'bg-slate-100',
    },
    {
      title: 'New Leads',
      value: metrics.newLeads ?? 0,
      subtext: 'Fresh submissions from homeowners',
      icon: FileText,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Leads Awaiting Review',
      value: metrics.leadsAwaitingReview ?? 0,
      subtext: 'Needs initial evaluation / doc check',
      icon: Clock,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
    {
      title: 'Site Visits Scheduled',
      value: metrics.siteVisitsScheduled ?? 0,
      subtext: 'Visit booked with field engineer',
      icon: CalendarCheck,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      title: 'Site Visits Pending Completion',
      value: metrics.siteVisitsPendingCompletion ?? 0,
      subtext: 'Accepted leads awaiting roof survey',
      icon: AlertCircle,
      color: 'text-orange-700',
      bg: 'bg-orange-50',
    },
    {
      title: 'Quotations Awaiting Approval',
      value: metrics.quotationsAwaitingApproval ?? 0,
      subtext: 'Sent to customer for decision',
      icon: FileCheck2,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Active Installations',
      value: metrics.activeInstallations ?? 0,
      subtext: 'Advance received / team on site',
      icon: Wrench,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
    },
    {
      title: 'Completed Projects',
      value: metrics.completedProjects ?? 0,
      subtext: 'Installed & grid synchronized',
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
    },
  ];

  return (
    <CompanyLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Sales & Operations Cockpit
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Solar Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time pipeline monitoring: customer inbound leads, site visits, quotations & turnkey installations.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={fetchDashboardData}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
              title="Refresh records from database"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <Link
              href="/leads"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <span>View Lead Pipeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* 8 Primary Dashboard Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 line-clamp-1">{card.title}</span>
                  <div className={`p-1.5 rounded-lg ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{card.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lead-to-Project Funnel Overview */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Lead-to-Project Workflow Stages</h2>
              <p className="text-xs text-slate-500">End-to-end solar conversion lifecycle</p>
            </div>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Active Database Records
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              {
                step: '1. Lead Review',
                count: metrics.leadsAwaitingReview ?? 0,
                desc: 'Verify customer bill & load',
              },
              {
                step: '2. Site Survey',
                count: metrics.siteVisitsPendingCompletion ?? 0,
                desc: 'Schedule & complete visit',
              },
              {
                step: '3. Quotation',
                count: metrics.quotationsAwaitingApproval ?? 0,
                desc: 'Prepare itemized proposal',
              },
              {
                step: '4. Installation',
                count: metrics.activeInstallations ?? 0,
                desc: 'Mount panels & grid sync',
              },
              {
                step: '5. Commissioned',
                count: metrics.completedProjects ?? 0,
                desc: 'Subsidy credited & live',
              },
            ].map((st, idx) => (
              <div
                key={st.step}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{st.step}</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {st.count}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inbound Leads Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Inbound Applications</h3>
              <p className="text-xs text-slate-500">Latest homeowners requesting solar installation</p>
            </div>
            <Link
              href="/leads"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
            >
              <span>View All Leads</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
              <span>Loading applications from database...</span>
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Users className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No applications found in database.</p>
              <p className="text-[11px] text-slate-400">
                Homeowners who submit via the Customer App (Port 3000) will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Lead ID</th>
                    <th className="px-5 py-3">Applicant Name</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3">Capacity</th>
                    <th className="px-5 py-3">Monthly Bill</th>
                    <th className="px-5 py-3">Current Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLeads.map((app) => (
                    <tr key={app.applicationId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-800">
                        {app.applicationId}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900">{app.personalDetails?.fullName}</div>
                        <div className="text-slate-400 text-[11px] font-mono">{app.personalDetails?.mobile}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span>{app.personalDetails?.city}, {app.personalDetails?.state}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {app.preliminaryEstimate?.recommendedCapacity || app.electricityDetails?.sanctionedLoad} kW
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-700">
                        ₹{Number(app.electricityDetails?.monthlyBill || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            app.status === 'SUBMITTED'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : app.status === 'SITE_SURVEY'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : app.status === 'FINAL_QUOTATION'
                              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              : app.status === 'CUSTOMER_APPROVAL'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : app.status === 'INSTALLATION_STARTED'
                              ? 'bg-orange-50 text-orange-800 border border-orange-200'
                              : ['INSTALLATION_COMPLETED', 'SUBSIDY_CREDITED'].includes(app.status)
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/leads/${app.applicationId}`}
                          className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-colors"
                        >
                          <span>Manage</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CompanyLayout>
  );
}
