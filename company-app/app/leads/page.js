'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CompanyLayout from '@/components/CompanyLayout';
import {
  Users,
  Search,
  ArrowRight,
  RefreshCw,
  MapPin,
  Calendar,
  Zap,
  Filter,
} from 'lucide-react';

export default function LeadsPipelinePage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const fetchLeads = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter !== 'ALL') params.append('status', statusFilter);
    if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);

    fetch(`/api/leads?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApplications(data.applications || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  return (
    <CompanyLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Pipeline Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Lead Pipeline
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review customer applications, verify electricity bill data, schedule site visits, and prepare quotations.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={fetchLeads}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, Customer Name, City, Consumer No..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              <Filter className="h-3.5 w-3.5" />
              <span>Stage:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              <option value="SUBMITTED">New Applications (SUBMITTED)</option>
              <option value="SITE_SURVEY">Site Visit & Survey (SITE_SURVEY)</option>
              <option value="FINAL_QUOTATION">Quotation Phase</option>
              <option value="CUSTOMER_APPROVAL">Awaiting Customer Approval</option>
              <option value="INSTALLATION">Installation Phase</option>
              <option value="COMPLETED">Completed Projects</option>
              <option value="INFO_REQUESTED">Information Requested</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Lead Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
              <span>Loading lead pipeline records...</span>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 space-y-2">
              <Users className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">No matching applications found</p>
              <p className="text-[11px] text-slate-400">
                Try clearing search terms or status filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Lead ID</th>
                    <th className="px-5 py-3">Applicant Info</th>
                    <th className="px-5 py-3">Property & Roof</th>
                    <th className="px-5 py-3">Solar Load & Bill</th>
                    <th className="px-5 py-3">Current Stage</th>
                    <th className="px-5 py-3">Site Visit</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.applicationId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                        {app.applicationId}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(app.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{app.personalDetails?.fullName}</div>
                        <div className="text-slate-500 text-[11px] font-mono">{app.personalDetails?.mobile}</div>
                        <div className="text-slate-400 text-[10px] flex items-center space-x-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{app.personalDetails?.city}, {app.personalDetails?.state}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {app.propertyDetails?.availableRoofArea} sq. ft.
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {app.propertyDetails?.roofType} Roof • {app.propertyDetails?.propertyType}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {app.preliminaryEstimate?.recommendedCapacity || app.electricityDetails?.sanctionedLoad} kW
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ₹{Number(app.electricityDetails?.monthlyBill || 0).toLocaleString('en-IN')}/mo
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          CA: {app.electricityDetails?.consumerNumber}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {app.siteVisit?.status === 'SCHEDULED' ? (
                          <div className="text-xs">
                            <span className="text-blue-700 font-bold flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(app.siteVisit.scheduledDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                              {app.siteVisit.assignedTo}
                            </span>
                          </div>
                        ) : app.siteVisit?.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span>Completed</span>
                          </span>
                        ) : app.siteVisit?.status === 'MISSED' ? (
                          <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                            Missed
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Not scheduled</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/leads/${app.applicationId}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
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
