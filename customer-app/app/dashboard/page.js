'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import {
  Sun,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function CustomerDashboard() {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});

    fetch('/api/applications')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApplications(data.applications || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalApps = applications.length;
  const activeApps = applications.filter(
    (app) => !['INSTALLATION_COMPLETED', 'SUBSIDY_CREDITED', 'REJECTED'].includes(app.status)
  ).length;
  const completedApps = applications.filter((app) =>
    ['INSTALLATION_COMPLETED', 'SUBSIDY_CREDITED'].includes(app.status)
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Homeowner Dashboard
              </span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome back, {user?.name || 'Solar Enthusiast'} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track your rooftop solar applications, survey schedules, and subsidy status.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/apply"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Solar Application</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {user?.name || 'Rajesh Sharma'}
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-[150px]">
                  {user?.email || 'customer@solarflow.demo'}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Mobile:</span>
              <strong className="text-slate-800">{user?.mobile || '9876543210'}</strong>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Applications</p>
              <h4 className="text-2xl font-black text-slate-900">{totalApps}</h4>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Active In-Progress</p>
              <h4 className="text-2xl font-black text-slate-900">{activeApps}</h4>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Completed Installations</p>
              <h4 className="text-2xl font-black text-slate-900">{completedApps}</h4>
            </div>
          </div>
        </div>

        <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold">
              <Sparkles className="h-3 w-3" />
              <span>PM Surya Ghar: Muft Bijli Yojana</span>
            </div>
            <h3 className="text-lg font-bold">
              Government Central Financial Assistance Active
            </h3>
            <p className="text-xs text-emerald-100 max-w-xl">
              Get direct bank transfer subsidy: ₹30,000 for 1 kW, ₹60,000 for 2 kW, and up to ₹78,000 for 3 kW and above systems.
            </p>
          </div>
          <Link
            href="/apply"
            className="flex-shrink-0 px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            Check Your Subsidy &rarr;
          </Link>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your Solar Applications</h2>
              <p className="text-xs text-slate-500">
                Track each stage from bill OCR verification to final subsidy credit
              </p>
            </div>
            {applications.length > 0 && (
              <span className="text-xs font-medium text-slate-500">
                Showing {applications.length} application{applications.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
              <p className="text-sm text-slate-500">Loading your applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-10 sm:p-14 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Sun className="h-9 w-9" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No solar applications submitted yet
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Ready to cut your electricity bill to zero? Start a new solar application.
                Upload your bill, receive a deterministic solar estimate in 60 seconds, and let our engineers take care of the rest.
              </p>
              <div className="mt-6">
                <Link
                  href="/apply"
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Start Your First Application</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Application ID</th>
                      <th className="px-6 py-3.5">Submission Date</th>
                      <th className="px-6 py-3.5">Capacity & City</th>
                      <th className="px-6 py-3.5">Monthly Bill</th>
                      <th className="px-6 py-3.5">Current Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications.map((app) => (
                      <tr
                        key={app._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                          {app.applicationId}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(app.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-900">
                            {app.preliminaryEstimate?.recommendedCapacity || 3} kW
                          </span>
                          <span className="block text-xs text-slate-400">
                            {app.personalDetails?.city || 'India'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-800 font-medium">
                          ₹{app.electricityDetails?.monthlyBill?.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/applications/${app.applicationId}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            <span>View Details</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
