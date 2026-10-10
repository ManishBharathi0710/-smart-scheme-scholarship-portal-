import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { MetricCard } from '../components/MetricCard';
import { DateRangePicker } from '../components/DateRangePicker';
import { OverviewCharts } from '../components/OverviewCharts';
import { AuditLogTable } from '../components/AuditLogTable';
import { SystemHealthStatus } from '../components/SystemHealthStatus';
import { ExportModal } from '../components/ExportModal';
import { analyticsApi } from '../api/analytics.api';
import {
  PlatformOverviewDto,
  UserAnalyticsDto,
  SchemeAnalyticsDto,
  RecommendationAnalyticsDto,
  DocumentAnalyticsDto,
  AiAnalyticsDto,
  DetailedSystemHealthDto,
  AuditLogsResponse,
  AnalyticsTimeRange,
  AuditResult,
  ExportType,
  ExportFormat,
} from '../../../types/analytics';

type AnalyticsTab =
  | 'overview'
  | 'schemes'
  | 'recommendations'
  | 'documents'
  | 'ai'
  | 'health'
  | 'audit';

export const AdminAnalyticsDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Data states
  const [overview, setOverview] = useState<PlatformOverviewDto | null>(null);
  const [usersData, setUsersData] = useState<UserAnalyticsDto | null>(null);
  const [schemesData, setSchemesData] = useState<SchemeAnalyticsDto | null>(null);
  const [recommendationsData, setRecommendationsData] =
    useState<RecommendationAnalyticsDto | null>(null);
  const [documentsData, setDocumentsData] = useState<DocumentAnalyticsDto | null>(null);
  const [aiData, setAiData] = useState<AiAnalyticsDto | null>(null);
  const [healthData, setHealthData] = useState<DetailedSystemHealthDto | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogsResponse>({
    items: [],
    pagination: { page: 1, limit: 15, total: 0, totalPages: 1 },
  });
  const [auditPage, setAuditPage] = useState(1);
  const [auditFilters, setAuditFilters] = useState<{
    action?: string;
    entityType?: string;
    result?: AuditResult;
  }>({});

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview') {
        const [ov, us, sc, rc] = await Promise.all([
          analyticsApi.getOverview({ timeRange }),
          analyticsApi.getUsers({ timeRange }),
          analyticsApi.getSchemes({ timeRange }),
          analyticsApi.getRecommendations({ timeRange }),
        ]);
        setOverview(ov);
        setUsersData(us);
        setSchemesData(sc);
        setRecommendationsData(rc);
      } else if (activeTab === 'schemes') {
        const sc = await analyticsApi.getSchemes({ timeRange });
        setSchemesData(sc);
      } else if (activeTab === 'recommendations') {
        const rc = await analyticsApi.getRecommendations({ timeRange });
        setRecommendationsData(rc);
      } else if (activeTab === 'documents') {
        const dc = await analyticsApi.getDocuments({ timeRange });
        setDocumentsData(dc);
      } else if (activeTab === 'ai') {
        const ai = await analyticsApi.getAi({ timeRange });
        setAiData(ai);
      } else if (activeTab === 'health') {
        const hl = await analyticsApi.getSystemHealth();
        setHealthData(hl);
      } else if (activeTab === 'audit') {
        const al = await analyticsApi.getAuditLogs({
          page: auditPage,
          limit: 15,
          ...auditFilters,
        });
        setAuditLogs(al);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load administrative analytics data.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, timeRange, auditPage, auditFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async (params: {
    exportType: ExportType;
    format: ExportFormat;
    timeRange: AnalyticsTimeRange;
  }) => {
    await analyticsApi.exportData(params);
  };

  return (
    <PageContainer>
      <div className="space-y-6" data-testid="admin-analytics-dashboard">
        {/* Top Header & Action Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Administrative Intelligence & Audit
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-blue-100 text-blue-800">
                Module 9
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cross-subsystem telemetry, conversion funnels, AI diagnostics, and immutable audit logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker value={timeRange} onChange={setTimeRange} disabled={isLoading} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExportModalOpen(true)}
              className="bg-white border-slate-300 font-semibold"
            >
              Export Report
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 overflow-x-auto">
          <nav className="flex space-x-6 min-w-max" aria-label="Analytics Tabs">
            {[
              { id: 'overview', label: 'Platform Overview' },
              { id: 'schemes', label: 'Schemes & Funnel' },
              { id: 'recommendations', label: 'Recommendations' },
              { id: 'documents', label: 'Documents & OCR' },
              { id: 'ai', label: 'AI Telemetry' },
              { id: 'health', label: 'System Health' },
              { id: 'audit', label: 'Audit Trail' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AnalyticsTab)}
                className={`py-3 px-1 border-b-2 font-medium text-xs transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB 1: PLATFORM OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {overview && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Registered Citizens"
                  value={overview.users.total.toLocaleString()}
                  subtitle={`${overview.users.new} new in selected range`}
                  trend={{ value: `${overview.users.active} active`, isPositive: true }}
                  color="blue"
                  testId="metric-total-users"
                />
                <MetricCard
                  title="Published Schemes"
                  value={overview.schemes.totalPublished}
                  subtitle={`${overview.schemes.openForApplication} open for applications`}
                  color="emerald"
                  testId="metric-published-schemes"
                />
                <MetricCard
                  title="Evaluations Generated"
                  value={overview.recommendations.totalGenerated.toLocaleString()}
                  subtitle={`${overview.recommendations.eligibleCount} direct eligible`}
                  color="purple"
                  testId="metric-total-recommendations"
                />
                <MetricCard
                  title="OCR Success Rate"
                  value={`${overview.documents.ocrSuccessRate}%`}
                  subtitle={`${overview.documents.ocrProcessed} processed`}
                  trend={{ value: `${overview.documents.totalUploaded} uploaded`, isPositive: true }}
                  color="amber"
                  testId="metric-ocr-success-rate"
                />
              </div>
            )}

            <OverviewCharts
              schemesData={schemesData}
              recommendationsData={recommendationsData}
              usersData={usersData}
            />
          </div>
        )}

        {/* TAB 2: SCHEMES & FUNNEL */}
        {activeTab === 'schemes' && (
          <div className="space-y-6">
            {schemesData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    title="Scheme Views"
                    value={schemesData.funnel.viewed.toLocaleString()}
                    subtitle="Citizen catalog visits"
                    color="blue"
                  />
                  <MetricCard
                    title="Saved Schemes"
                    value={schemesData.funnel.saved.toLocaleString()}
                    subtitle={`${schemesData.conversionRates.viewToSaveRate}% view-to-save rate`}
                    color="emerald"
                  />
                  <MetricCard
                    title="Official Portal Redirections"
                    value={schemesData.funnel.officialPortalClicked.toLocaleString()}
                    subtitle={`${schemesData.conversionRates.saveToApplyClickRate}% save-to-apply rate`}
                    color="purple"
                  />
                </div>

                <OverviewCharts schemesData={schemesData} />
              </>
            )}
          </div>
        )}

        {/* TAB 3: RECOMMENDATIONS */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {recommendationsData && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Evaluations"
                    value={recommendationsData.totalEvaluations}
                    subtitle="Rule engine runs"
                    color="blue"
                  />
                  <MetricCard
                    title="Eligible"
                    value={recommendationsData.distribution.eligible}
                    subtitle={`${recommendationsData.distributionPercentages.eligible}% match`}
                    color="emerald"
                  />
                  <MetricCard
                    title="Likely Eligible"
                    value={recommendationsData.distribution.likelyEligible}
                    subtitle={`${recommendationsData.distributionPercentages.likelyEligible}% match`}
                    color="amber"
                  />
                  <MetricCard
                    title="Not Eligible"
                    value={recommendationsData.distribution.notEligible}
                    subtitle={`${recommendationsData.distributionPercentages.notEligible}% of total`}
                    color="slate"
                  />
                </div>

                <OverviewCharts recommendationsData={recommendationsData} />
              </>
            )}
          </div>
        )}

        {/* TAB 4: DOCUMENTS & OCR */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {documentsData && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    title="Documents Uploaded"
                    value={documentsData.totalUploaded}
                    subtitle="Citizen vault records"
                    color="blue"
                  />
                  <MetricCard
                    title="OCR Processed"
                    value={documentsData.totalProcessed}
                    subtitle="Automated text extraction"
                    color="purple"
                  />
                  <MetricCard
                    title="High Confidence OCR"
                    value={documentsData.confidenceDistribution.high}
                    subtitle="> 80% accuracy"
                    color="emerald"
                  />
                  <MetricCard
                    title="Overall OCR Success"
                    value={`${documentsData.ocrSuccessRate}%`}
                    subtitle={`${documentsData.ocrFailureRate}% error rate`}
                    color="amber"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">
                      Confidence Score Distribution
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-emerald-700">High (&gt;80%)</span>
                          <span>{documentsData.confidenceDistribution.high}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (documentsData.confidenceDistribution.high /
                                  (documentsData.totalProcessed || 1)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-amber-700">Medium (60-79%)</span>
                          <span>{documentsData.confidenceDistribution.medium}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (documentsData.confidenceDistribution.medium /
                                  (documentsData.totalProcessed || 1)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-rose-700">Low (&lt;60%)</span>
                          <span>{documentsData.confidenceDistribution.low}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (documentsData.confidenceDistribution.low /
                                  (documentsData.totalProcessed || 1)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">
                      Uploaded Document Types Breakdown
                    </h3>
                    <div className="space-y-2">
                      {documentsData.documentTypesBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs py-1 border-b border-slate-100 last:border-0"
                        >
                          <span className="font-mono text-slate-700">{item.type}</span>
                          <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 5: AI ASSISTANT TELEMETRY */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {aiData && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total AI Invocations"
                    value={aiData.totalRequests}
                    subtitle={`${aiData.successfulRequests} successful`}
                    color="purple"
                  />
                  <MetricCard
                    title="Average Latency"
                    value={`${aiData.averageDurationMs} ms`}
                    subtitle="End-to-end response time"
                    color="blue"
                  />
                  <MetricCard
                    title="Total Tokens Processed"
                    value={(aiData.totalInputTokens + aiData.totalOutputTokens).toLocaleString()}
                    subtitle={`In: ${aiData.totalInputTokens.toLocaleString()} | Out: ${aiData.totalOutputTokens.toLocaleString()}`}
                    color="emerald"
                  />
                  <MetricCard
                    title="Estimated Cost"
                    value={`$${aiData.estimatedCostUsd}`}
                    subtitle="USD token expenditure"
                    color="amber"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Intent Distribution</h3>
                    <div className="space-y-2">
                      {aiData.intentDistribution.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0"
                        >
                          <span className="font-medium text-slate-700">{item.intent}</span>
                          <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {item.count} queries
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Safety & Guardrail Events</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded">
                        <span className="text-slate-700">Prompt Injections Blocked</span>
                        <span className="font-bold text-slate-900">
                          {aiData.safetyEvents.promptInjectionsBlocked}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded">
                        <span className="text-slate-700">Contradictions Prevented by Grounding</span>
                        <span className="font-bold text-slate-900">
                          {aiData.safetyEvents.validationContradictionsPrevented}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 6: SYSTEM HEALTH */}
        {activeTab === 'health' && (
          <SystemHealthStatus
            health={healthData}
            isLoading={isLoading}
            onRefresh={loadData}
          />
        )}

        {/* TAB 7: AUDIT LOG TRAIL */}
        {activeTab === 'audit' && (
          <AuditLogTable
            logs={auditLogs.items}
            isLoading={isLoading}
            currentPage={auditPage}
            totalPages={auditLogs.pagination.totalPages}
            totalItems={auditLogs.pagination.total}
            onPageChange={(page) => setAuditPage(page)}
            onFilterChange={(filters) => {
              setAuditFilters(filters);
              setAuditPage(1);
            }}
          />
        )}

        {/* Export Dialog */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
        />
      </div>
    </PageContainer>
  );
};
