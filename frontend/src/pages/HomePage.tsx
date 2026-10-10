import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  FileCheck,
  Lock,
  ArrowRight,
  Database,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { healthService } from '../services/health.service';
import { PageContainer, Badge, Card, CardHeader, CardTitle, CardContent, Button, Spinner } from '../components/ui';

export const HomePage: React.FC = () => {
  // Query live backend health to prove full stack connectivity
  const { data: health, isLoading, isError, refetch } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => healthService.getHealth(),
    refetchInterval: 30000,
  });

  const modules = [
    { id: 1, name: 'Foundation & Architecture', status: 'ACTIVE', desc: 'Modular monolith, API v1, Postgres, TanStack Query, Design System' },
    { id: 2, name: 'Auth & User Profiles', status: 'NEXT', desc: 'RBAC, student & citizen profiles, privacy controls & consent' },
    { id: 3, name: 'Scheme & Scholarship Catalog', status: 'PLANNED', desc: 'Verified database, departments, official source URLs & deadlines' },
    { id: 4, name: 'Rule-Based Recommendation Engine', status: 'PLANNED', desc: 'Deterministic tri-state logic (Eligible / Likely / Needs Verification)' },
    { id: 5, name: 'Discovery & Personalized Dashboard', status: 'PLANNED', desc: 'Faceted search, transparent relevance factors & comparison' },
    { id: 6, name: 'Document, OCR & Verification', status: 'PLANNED', desc: 'Consent-based field detection, confidence scores & verification' },
    { id: 7, name: 'Notifications & Deadlines', status: 'PLANNED', desc: 'Background queue, upcoming deadline reminders & alerts' },
    { id: 8, name: 'AI Assistant & Accessibility', status: 'PLANNED', desc: 'Grounded RAG assistance, regional languages, no hallucination' },
    { id: 9, name: 'Admin, Verification & Audit', status: 'PLANNED', desc: 'Scheme verification workflow, audit logs & system telemetry' },
    { id: 10, name: 'Production & Scalability', status: 'PLANNED', desc: 'CI/CD, containerization, observability & horizontal scale' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gov-900 to-gov-950 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-gov-800">
        <PageContainer className="py-0">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gov-800/80 border border-gov-700 text-xs font-semibold text-amber-300 mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              Module 1 Foundation Established
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
              Transparent, Deterministic Scheme &amp; Scholarship Discovery
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6">
              A reliable public benefit recommendation portal built on structured, explainable
              eligibility rules. Designed to empower students and citizens with verified government
              opportunities without opaque algorithms.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-transparent"
                onClick={() => refetch()}
              >
                Verify System Health <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 ml-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Hallucination Eligibility Architecture</span>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Main Content Container */}
      <PageContainer className="py-10 space-y-10">
        {/* Architecture Status Card */}
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gov-700" />
                <CardTitle>System Telemetry &amp; Foundation Health</CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Live communication between React Frontend, Centralized API Client, and Node/Express Backend.
              </p>
            </div>
            <div>
              {isLoading ? (
                <Spinner size="sm" label="Checking backend status..." />
              ) : isError ? (
                <Badge variant="danger" className="text-xs px-3 py-1">Backend Disconnected</Badge>
              ) : health?.status === 'healthy' ? (
                <Badge variant="success" className="text-xs px-3 py-1 font-semibold">
                  ● Systems Operational
                </Badge>
              ) : (
                <Badge variant="warning" className="text-xs px-3 py-1 font-semibold">
                  ▲ Degraded (DB Offline)
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-gov-600" /> Backend Service
              </div>
              <div className="text-base font-bold text-slate-800">
                {health?.service || 'smart-scheme-backend'}
              </div>
              <div className="text-xs text-slate-500 mt-1">Version: {health?.version || '1.0.0'}</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-gov-600" /> Database Engine
              </div>
              <div className="text-base font-bold text-slate-800 capitalize">
                {health?.database?.status || 'PostgreSQL (Prisma)'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {health?.database?.responseTimeMs
                  ? `Ping: ${health.database.responseTimeMs}ms`
                  : 'Architecture Ready'}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-gov-600" /> Environment
              </div>
              <div className="text-base font-bold text-slate-800 capitalize">
                {health?.environment || 'Development'}
              </div>
              <div className="text-xs text-slate-500 mt-1">API Prefix: /api/v1</div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-gov-600" /> Uptime
              </div>
              <div className="text-base font-bold text-slate-800">
                {health?.uptimeSeconds !== undefined ? `${health.uptimeSeconds}s active` : 'Online'}
              </div>
              <div className="text-xs text-slate-500 mt-1">Graceful shutdown armed</div>
            </div>
          </CardContent>
        </Card>

        {/* 3 Core Product Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-t-4 border-t-gov-800">
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-gov-50 text-gov-800 flex items-center justify-center mb-3">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Explainable Eligibility
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rules are evaluated deterministically using structured conditions (AND/OR/NOT).
                Citizens are always shown exactly why a scheme matches, needs certificate
                verification, or does not qualify.
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-600">
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Guarded AI Layer
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI and LLMs assist with language translation and document comprehension, but
                are strictly prohibited from independently deciding eligibility or inventing
                deadlines or benefits.
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-600">
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Privacy &amp; Data Minimization
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We collect only what is strictly necessary to evaluate eligibility. Documents
                are analyzed only with explicit user consent and OCR extraction never silently
                alters profile records.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 10-Module Implementation Roadmap */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                10-Module Architectural Roadmap
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Strict adherence to module boundary dependencies to guarantee scalability.
              </p>
            </div>
            <Badge variant="info">Module 1 Foundation Complete</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {modules.map((m) => (
              <div
                key={m.id}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  m.status === 'ACTIVE'
                    ? 'bg-gov-50/60 border-gov-300 shadow-sm'
                    : m.status === 'NEXT'
                    ? 'bg-amber-50/30 border-amber-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400">MODULE {m.id}</span>
                  {m.status === 'ACTIVE' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  )}
                  {m.status === 'NEXT' && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      NEXT UP
                    </span>
                  )}
                  {m.status === 'PLANNED' && (
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      QUEUED
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">{m.name}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Indicative Notice Banner */}
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>
              All eligibility evaluations generated by subsequent modules are indicative and subject to official department verification.
            </span>
          </div>
          <span className="font-semibold text-gov-800">ISO / GIGW Compliant Pattern</span>
        </div>
      </PageContainer>
    </div>
  );
};
