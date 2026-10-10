import React from 'react';
import { AlertCircle, ExternalLink, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      {/* Disclaimer Strip */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-start gap-3.5 text-xs text-slate-400 leading-relaxed">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">
              Important Public Service Notice &amp; Legal Disclaimer:
            </p>
            <p>
              This platform provides information and decision-support recommendation assistance based on
              the details provided by the citizen. Eligibility shown by this platform is{' '}
              <strong className="text-slate-200 font-semibold">indicative</strong> and does{' '}
              <strong className="text-slate-200 font-semibold">not guarantee approval</strong>.
            </p>
            <p>
              Final eligibility, verification, sanction, and benefit disbursement are determined solely
              by the respective government department, institution, or authorized authority. Users
              should always verify the latest information and deadlines on the official government
              application portal.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>Smart Scheme Portal</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            A trustworthy, deterministic rule-based portal connecting students and citizens with
            verified central and state government schemes, scholarships, and welfare programs.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            Core Modules
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>Foundation &amp; System Architecture (Active)</li>
            <li>Authentication &amp; User Profiles (Ready)</li>
            <li>Verified Schemes &amp; Scholarships</li>
            <li>Deterministic Eligibility Engine</li>
            <li>Document &amp; Verification System</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            Governance &amp; Privacy
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>Transparent Explainable Rules</li>
            <li>Data Minimization Principles</li>
            <li>Consent-Based Document Analysis</li>
            <li>No Automated Disqualifications</li>
            <li>Security &amp; Audit Trail Standards</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            External Resources
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>
              <a
                href="https://www.india.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors inline-flex items-center gap-1"
              >
                National Portal of India <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a
                href="https://scholarships.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors inline-flex items-center gap-1"
              >
                National Scholarship Portal <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a
                href="https://www.myscheme.gov.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors inline-flex items-center gap-1"
              >
                myScheme Service Platform <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4 px-4 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Smart Scheme &amp; Scholarship Portal. Designed for
        high accessibility, determinism, and citizen data protection.
      </div>
    </footer>
  );
};
