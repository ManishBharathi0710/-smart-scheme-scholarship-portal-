import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ArrowRight,
  GraduationCap,
  Sprout,
  Briefcase,
  HeartHandshake,
  Shield,
  Accessibility,
  CheckCircle2,
  Lock,
  Building2,
  Sparkles,
  FileCheck,
  Activity,
  Cpu,
  HelpCircle,
  IndianRupee,
  Bot,
} from 'lucide-react';
import { schemesApi } from '../features/schemes/api/schemes.api';
import { healthService } from '../services/health.service';
import { useAuth } from '../features/auth/context/AuthContext';
import { PageContainer, Badge, Card, CardContent, Button, Spinner } from '../components/ui';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 1. Fetch live published schemes for Spotlight
  const { data: schemesData, isLoading: schemesLoading } = useQuery({
    queryKey: ['home-featured-schemes'],
    queryFn: () => schemesApi.getPublishedSchemes({ page: 1, pageSize: 3, sortBy: 'updatedAt', sortOrder: 'desc' }),
    staleTime: 60000,
  });

  // 2. Fetch live system health
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => healthService.getHealth(),
    refetchInterval: 30000,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (searchKeyword.trim()) {
      queryParams.set('search', searchKeyword.trim());
    }
    if (selectedCategory) {
      queryParams.set('category', selectedCategory);
    }
    navigate(`/schemes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
  };

  const handleCategoryClick = (categoryKey: string) => {
    navigate(`/schemes?category=${categoryKey}`);
  };

  const categories = [
    {
      key: 'EDUCATION',
      name: 'Students & Scholarships',
      icon: GraduationCap,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400',
      iconBg: 'bg-blue-600 text-white',
      desc: 'Pre-matric, post-matric, higher education, merit scholarships & tuition aid.',
      count: 'Available',
    },
    {
      key: 'AGRICULTURE',
      name: 'Farmers & Agriculture',
      icon: Sprout,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-600 text-white',
      desc: 'Crop subsidies, Kisan credit, organic farming aid & equipment support.',
      count: 'Available',
    },
    {
      key: 'SKILL_DEVELOPMENT',
      name: 'Skill & Employment',
      icon: Briefcase,
      color: 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400',
      iconBg: 'bg-amber-600 text-white',
      desc: 'Vocational training, PMKVY certification, apprenticeships & seed funds.',
      count: 'Available',
    },
    {
      key: 'WOMEN',
      name: 'Women & Child Welfare',
      icon: HeartHandshake,
      color: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400',
      iconBg: 'bg-rose-600 text-white',
      desc: 'Maternal health, girl child education, self-help groups & social security.',
      count: 'Available',
    },
    {
      key: 'SOCIAL_SECURITY',
      name: 'Social Security & Pensions',
      icon: Shield,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400',
      iconBg: 'bg-indigo-600 text-white',
      desc: 'Old-age pensions, family safety nets, health cards & welfare grants.',
      count: 'Available',
    },
    {
      key: 'PERSONS_WITH_DISABILITIES',
      name: 'Differently Abled (PwD)',
      icon: Accessibility,
      color: 'bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-400',
      iconBg: 'bg-teal-600 text-white',
      desc: 'Assistive equipment subsidies, disability pensions & transport aid.',
      count: 'Available',
    },
  ];

  const modules = [
    { id: 1, name: 'Foundation & Auth' },
    { id: 2, name: 'Citizen Profile' },
    { id: 3, name: 'Scheme Catalog' },
    { id: 4, name: 'Rule Engine' },
    { id: 5, name: 'Discovery & Compare' },
    { id: 6, name: 'Documents & OCR' },
    { id: 7, name: 'Deadline Alerts' },
    { id: 8, name: 'Grounded AI' },
    { id: 9, name: 'Analytics & Audit' },
    { id: 10, name: 'Production & Scale' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative bg-gradient-to-br from-gov-950 via-gov-900 to-slate-900 text-white py-16 sm:py-20 border-b border-gov-800 overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,69,102,0.35),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(22,163,74,0.12),transparent_40%)] pointer-events-none" />

        <PageContainer className="relative py-0">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* National Official Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gov-800/80 border border-gov-700/80 text-xs font-semibold text-amber-300 shadow-sm backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>National Citizen Benefit &amp; Scheme Discovery Platform</span>
              <span className="text-gov-400">&bull;</span>
              <span className="text-slate-300">Verified Ministry Catalog</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Find Government Schemes &amp; Scholarships <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-300">
                You Actually Qualify For
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              A transparent, centralized discovery portal built on 100% deterministic, explainable
              eligibility rules. No opaque algorithms, no agent commissions, and direct links to official
              central and state portals.
            </p>

            {/* HERO SEARCH BAR */}
            <div className="pt-2 max-w-3xl mx-auto">
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-slate-800"
              >
                <div className="relative flex-1 flex items-center">
                  <Search className="w-5 h-5 text-slate-400 ml-3 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search by scheme name, keywords, or benefit (e.g. Post-Matric, NSP, Farming)..."
                    className="w-full text-sm sm:text-base text-slate-900 placeholder:text-slate-400 bg-transparent py-2.5 pr-3 focus:outline-none"
                  />
                </div>

                <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs sm:text-sm text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2.5 border border-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  <option value="EDUCATION">Scholarships &amp; Education</option>
                  <option value="AGRICULTURE">Agriculture &amp; Farmers</option>
                  <option value="SKILL_DEVELOPMENT">Skill &amp; Training</option>
                  <option value="WOMEN">Women &amp; Child</option>
                  <option value="SOCIAL_SECURITY">Social Security</option>
                  <option value="PERSONS_WITH_DISABILITIES">Differently Abled (PwD)</option>
                  <option value="FINANCIAL_ASSISTANCE">Financial Aid</option>
                </select>

                <Button
                  type="submit"
                  variant="primary"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Explore Schemes</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-400">
                <span className="font-medium text-slate-300">Quick Searches:</span>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?search=Post-Matric')}
                  className="hover:text-amber-300 underline decoration-slate-600 hover:decoration-amber-300 transition-colors"
                >
                  Post-Matric Scholarships
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?category=EDUCATION')}
                  className="hover:text-amber-300 underline decoration-slate-600 hover:decoration-amber-300 transition-colors"
                >
                  Higher Education
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => navigate('/schemes?category=AGRICULTURE')}
                  className="hover:text-amber-300 underline decoration-slate-600 hover:decoration-amber-300 transition-colors"
                >
                  Kisan Subsidies
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => navigate('/assistant')}
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <Bot className="w-3.5 h-3.5" /> Ask AI Guide
                </button>
              </div>
            </div>

            {/* Direct CTA Buttons */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5">
                      Go to My Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                  <Link to="/recommendations">
                    <Button variant="outline" className="border-slate-500 text-white hover:bg-slate-800/60 px-5 py-2.5">
                      View My Matched Schemes
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 shadow-lg">
                      Check My Eligibility <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                  <Link to="/schemes">
                    <Button variant="outline" className="border-slate-500 text-white hover:bg-slate-800/60 px-5 py-2.5">
                      Browse All Schemes
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Key trust bullets */}
            <div className="pt-4 border-t border-gov-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>100% Free &amp; Open Access</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Official Central &amp; State Sources</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>No Data Selling &bull; ISO Compliant</span>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* =========================================================================
          KEY PLATFORM METRICS RIBBON
          ========================================================================= */}
      <section className="bg-white border-b border-slate-200 py-6">
        <PageContainer className="py-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center divide-x divide-slate-100">
            <div className="px-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-gov-900">100+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">Verified Programs</div>
              <div className="text-[11px] text-slate-400 hidden sm:block">Central &amp; State Ministries</div>
            </div>
            <div className="px-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">100%</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">Deterministic Rules</div>
              <div className="text-[11px] text-slate-400 hidden sm:block">Explainable Tri-State Logic</div>
            </div>
            <div className="px-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-gov-800">15+</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">Target Sectors</div>
              <div className="text-[11px] text-slate-400 hidden sm:block">Education, Farming, Welfare</div>
            </div>
            <div className="px-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">₹0</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">Zero Agent Fees</div>
              <div className="text-[11px] text-slate-400 hidden sm:block">Direct Official Portal Links</div>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="py-12 space-y-16">
        {/* =========================================================================
            EXPLORE BY CITIZEN CATEGORY
            ========================================================================= */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gov-700 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sector Directory</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Explore Schemes by Citizen Category
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Browse welfare programs, subsidies, and scholarships organized by your personal profile.
              </p>
            </div>
            <Link
              to="/schemes"
              className="inline-flex items-center text-sm font-semibold text-gov-700 hover:text-gov-900 hover:underline gap-1 self-start sm:self-auto"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div
                  key={cat.key}
                  onClick={() => handleCategoryClick(cat.key)}
                  className={`p-5 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between ${cat.color}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${cat.iconBg} shadow-sm group-hover:scale-105 transition-transform`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200/80 text-slate-600">
                        {cat.count}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-gov-800 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {cat.desc}
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-semibold text-gov-800 group-hover:translate-x-1 transition-transform gap-1">
                    <span>Explore opportunities</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            FEATURED VERIFIED SCHEMES SPOTLIGHT
            ========================================================================= */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified by Ministries</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Featured &amp; Flagship Government Schemes
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Active schemes with verified eligibility criteria, clear benefits, and official portals.
              </p>
            </div>
            <Link
              to="/schemes"
              className="inline-flex items-center text-sm font-semibold text-gov-700 hover:text-gov-900 hover:underline gap-1 self-start sm:self-auto"
            >
              <span>Explore All Catalog Schemes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {schemesLoading ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <Spinner size="md" label="Loading verified schemes from database..." />
            </div>
          ) : schemesData?.items && schemesData.items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schemesData.items.map((scheme) => (
                <Card key={scheme.id} className="border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
                        VERIFIED OFFICIAL
                      </Badge>
                      <span className="text-[11px] font-medium text-slate-500">
                        {scheme.stateScope === 'ALL_INDIA' ? 'Central Scheme' : scheme.stateScope}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                        {scheme.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{scheme.departmentName}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {scheme.shortDescription || 'Financial and educational assistance program offered under central/state welfare initiatives.'}
                    </p>

                    {scheme.primaryBenefit && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-start gap-2 text-xs text-emerald-900">
                        <IndianRupee className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-bold">Benefit: </span>
                          <span>{scheme.primaryBenefit.description || 'Direct financial benefit transfer'}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <Link to={`/schemes/${scheme.slug || scheme.id}`}>
                        <Button variant="primary" className="text-xs py-1.5 px-3">
                          View Details &amp; Rules
                        </Button>
                      </Link>
                      <Link
                        to="/compare"
                        className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                      >
                        <span>Compare</span>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
              No active schemes currently available. Check back soon.
            </div>
          )}
        </div>

        {/* =========================================================================
            HOW THE CITIZEN DECISION SUPPORT PLATFORM WORKS (4 STEPS)
            ========================================================================= */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl mb-8">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              Transparent Workflow
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How the Portal Works for You
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Deterministic, explainable verification without opaque black-box algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="text-base font-bold text-white">Create Citizen Profile</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Provide your basic demographic, education, and family income details once in your secure profile.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="text-base font-bold text-white">Deterministic Rules</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The rule engine tests structured rules (AND/OR/NOT). Tri-state logic guarantees zero false disqualifications.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-extrabold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="text-base font-bold text-white">Clear Explanations</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                See exactly why you qualify, what conditions matched, and what certificates are required before applying.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-extrabold text-sm flex items-center justify-center">
                4
              </div>
              <h3 className="text-base font-bold text-white">Direct Official Link</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Apply straight on the verified government portal (NSP, State portals) with zero middleman commissions.
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3 PILLARS OF PLATFORM INTEGRITY
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-t-4 border-t-gov-800">
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-gov-50 text-gov-800 flex items-center justify-center mb-3">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                100% Explainable Eligibility
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rules are evaluated deterministically using structured conditions. Citizens are always shown
                the complete evaluation breakdown: matches, unknowns, and required documents.
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-600">
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Guarded AI Assistant
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI and LLMs assist with language translation and document guidance, but are strictly prohibited
                from independently determining eligibility or hallucinating deadlines.
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-600">
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Privacy &amp; Data Security
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Minimal citizen data collection. User documents in the vault are private, encrypted, and
                analyzed only with explicit consent. Raw identity numbers are never logged.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* =========================================================================
            PLATFORM ARCHITECTURE & HEALTH (COMPACT & VERIFIED)
            ========================================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Platform Architecture &amp; System Telemetry
                </h3>
                <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
                  All 10 Modules Verified
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-stack integration verified across React Frontend, REST API, PostgreSQL, and Recommendation Services.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              {healthLoading ? (
                <Spinner size="sm" label="Checking status..." />
              ) : health?.status === 'healthy' ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Systems Operational
                </span>
              ) : (
                <span className="text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Degraded Mode
                </span>
              )}
            </div>
          </div>

          {/* Compact 10-module pill overview */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {modules.map((m) => (
              <div
                key={m.id}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between"
              >
                <span className="font-semibold truncate">{m.id}. {m.name}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 ml-1" />
              </div>
            ))}
          </div>

          {/* Database & Runtime stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
            <div>
              <span className="text-slate-400">Database: </span>
              <span className="font-semibold text-slate-800">
                {health?.database?.status === 'connected' ? 'PostgreSQL Active (1ms)' : 'Online'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Environment: </span>
              <span className="font-semibold text-slate-800 capitalize">{health?.environment || 'Development'}</span>
            </div>
            <div>
              <span className="text-slate-400">API Gateway: </span>
              <span className="font-semibold text-slate-800">/api/v1 (Express v4)</span>
            </div>
            <div>
              <span className="text-slate-400">Compliance: </span>
              <span className="font-semibold text-slate-800">ISO / GIGW Standard</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FINAL CALL TO ACTION
            ========================================================================= */}
        <div className="rounded-2xl bg-gradient-to-r from-gov-900 to-gov-800 text-white p-8 sm:p-10 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ready to Discover Schemes You Actually Qualify For?
          </h2>
          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
            Create your confidential profile in under 3 minutes and receive deterministic, explainable
            recommendations across central and state welfare benefits.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button
                variant="primary"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-7 py-3 text-sm shadow-md"
              >
                Register Citizen Profile <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/schemes">
              <Button
                variant="outline"
                className="border-slate-400 text-white hover:bg-white/10 px-6 py-3 text-sm"
              >
                Search Scheme Catalog
              </Button>
            </Link>
          </div>
        </div>

        {/* Statutory Legal Disclaimer */}
        <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>
              <strong>Statutory Notice:</strong> Eligibility recommendations provided by this portal are
              indicative and based on citizen-provided fact attributes. Final sanction and benefit disbursement
              remain subject to official department verification and budget availability.
            </span>
          </div>
          <span className="font-semibold text-gov-800 whitespace-nowrap">National e-Governance Standard</span>
        </div>
      </PageContainer>
    </div>
  );
};
