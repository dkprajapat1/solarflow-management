import Link from 'next/link';
import { Sun, ShieldCheck, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Sun className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-800">SolarFlow</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              AI-Powered Rooftop Solar Management Platform connecting homeowners
              with certified solar engineering teams. Clean, transparent energy for every roof.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>PM Surya Ghar Compliant</span>
              </span>
              <span className="flex items-center space-x-1">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Deterministic Calculations</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/dashboard" className="hover:text-emerald-700">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/apply" className="hover:text-emerald-700">
                  New Solar Application
                </Link>
              </li>
              <li>
                <Link href="/dashboard/profile" className="hover:text-emerald-700">
                  My Profile
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-700 font-medium text-emerald-700"
                >
                  Company Staff Portal &rarr;
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Direct Assistance
            </h4>
            <p className="text-sm text-slate-600">
              Toll-Free National Subsidy Helpdesk:
            </p>
            <p className="text-base font-semibold text-emerald-700 mt-1">
              1800-180-3333
            </p>
            <p className="text-xs text-slate-400 mt-2">
              All estimations are preliminary and subject to technical site survey.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} SolarFlow Platform. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center">
            Built for homeowners & certified solar installers.
          </p>
        </div>
      </div>
    </footer>
  );
}
