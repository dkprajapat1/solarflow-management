'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import {
  User,
  LogOut,
  Save,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function CustomerProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            mobile: data.user.mobile || '',
          });
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
      .catch(() => {});
  }, []);

  const handleUpdate = (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Customer Profile & Account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal contact details, credentials, and review past submissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-3xl font-bold shadow-md shadow-emerald-600/20 mb-4 ring-4 ring-emerald-50">
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{formData.name || 'Customer'}</h2>
              <p className="text-xs text-slate-500">{formData.email}</p>
              <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                <span>Verified Homeowner</span>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout of Session</span>
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                Personal Contact Details
              </h3>

              {saveSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Profile details updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Email is associated with your login account and cannot be modified.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
                <span>Application History</span>
                <span className="text-xs text-slate-400 font-normal">
                  {applications.length} submitted
                </span>
              </h3>

              {applications.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No applications recorded on this account yet.{' '}
                  <Link href="/apply" className="text-emerald-700 font-semibold underline">
                    Submit one now
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <div
                      key={app._id}
                      className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">
                          {app.applicationId}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(app.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          • {app.preliminaryEstimate?.recommendedCapacity || 3} kW
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <StatusBadge status={app.status} />
                        <Link
                          href={`/dashboard/applications/${app.applicationId}`}
                          className="text-emerald-700 hover:text-emerald-900 font-semibold"
                        >
                          View &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
