import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminAnalyticsDashboardPage } from './AdminAnalyticsDashboardPage';
import { analyticsApi } from '../api/analytics.api';
import {
  PlatformOverviewDto,
  UserAnalyticsDto,
  SchemeAnalyticsDto,
  RecommendationAnalyticsDto,
  DetailedSystemHealthDto,
  AuditLogsResponse,
} from '../../../types/analytics';

vi.mock('../api/analytics.api');

const mockOverview: PlatformOverviewDto = {
  dateRange: { startDate: '2026-08-27', endDate: '2026-09-26' },
  users: { total: 1250, active: 620, new: 110 },
  schemes: {
    totalPublished: 48,
    openForApplication: 14,
    totalViews: 8500,
    totalSaved: 2300,
    officialPortalClicks: 940,
  },
  recommendations: {
    totalGenerated: 4200,
    eligibleCount: 1680,
    likelyEligibleCount: 1260,
    needsVerificationCount: 840,
    notEligibleCount: 420,
  },
  documents: { totalUploaded: 950, ocrProcessed: 880, ocrSuccessRate: 94 },
  notifications: { totalSent: 6500, unreadCount: 430 },
  aiUsage: { totalQueries: 1400, successfulQueries: 1385, averageDurationMs: 340 },
};

const mockUsers: UserAnalyticsDto = {
  totalUsers: 1250,
  activeUsers: 620,
  newUsers: 110,
  registrationsTrend: [{ date: '2026-09-20', count: 15 }],
  activeUsersTrend: [{ date: '2026-09-20', count: 180 }],
  profileCompletionBuckets: { '0_25': 120, '26_50': 250, '51_75': 480, '76_99': 280, '100': 120 },
  usersWithRecommendations: 890,
  usersWithSavedSchemes: 610,
  usersWithDocuments: 430,
  usersWithAiChats: 320,
};

const mockSchemes: SchemeAnalyticsDto = {
  totalPublished: 48,
  openApplications: 14,
  funnel: { viewed: 8500, saved: 2300, officialPortalClicked: 940 },
  conversionRates: { viewToSaveRate: 27, saveToApplyClickRate: 41, overallFunnelRate: 11 },
  topSavedSchemes: [{ id: 's-1', name: 'Post-Matric Scholarship', count: 420 }],
  topViewedSchemes: [{ id: 's-1', name: 'Post-Matric Scholarship', count: 1850 }],
  topPortalClickedSchemes: [{ id: 's-1', name: 'Post-Matric Scholarship', count: 210 }],
  categoryDistribution: [{ category: 'EDUCATION', count: 28 }],
};

const mockRecommendations: RecommendationAnalyticsDto = {
  totalEvaluations: 4200,
  distribution: { eligible: 1680, likelyEligible: 1260, needsVerification: 840, notEligible: 420 },
  distributionPercentages: { eligible: 40, likelyEligible: 30, needsVerification: 20, notEligible: 10 },
  topCriteriaFailures: [{ condition: 'Annual Family Income Limit', count: 320 }],
};

const mockHealth: DetailedSystemHealthDto = {
  overallStatus: 'HEALTHY',
  uptimeSeconds: 86400,
  timestamp: new Date().toISOString(),
  services: {
    api: { status: 'HEALTHY', latencyMs: 5 },
    database: { status: 'HEALTHY', latencyMs: 12 },
    storage: { status: 'HEALTHY' },
    ocr: { status: 'HEALTHY' },
    ai: { status: 'HEALTHY' },
    notifications: { status: 'HEALTHY' },
    scheduler: { status: 'HEALTHY' },
  },
};

const mockAuditLogs: AuditLogsResponse = {
  items: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      actorUserId: 'u-1',
      actorEmail: 'admin@gov.in',
      actorRole: 'ADMIN',
      action: 'SCHEME_PUBLISHED',
      entityType: 'Scheme',
      entityId: 'sc-100',
      result: 'SUCCESS',
      timestamp: new Date().toISOString(),
    },
  ],
  pagination: { page: 1, limit: 15, total: 1, totalPages: 1 },
};

describe('AdminAnalyticsDashboardPage (Module 9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getOverview).mockResolvedValue(mockOverview);
    vi.mocked(analyticsApi.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(analyticsApi.getSchemes).mockResolvedValue(mockSchemes);
    vi.mocked(analyticsApi.getRecommendations).mockResolvedValue(mockRecommendations);
    vi.mocked(analyticsApi.getSystemHealth).mockResolvedValue(mockHealth);
    vi.mocked(analyticsApi.getAuditLogs).mockResolvedValue(mockAuditLogs);
  });

  it('renders dashboard title and overview KPI metric cards', async () => {
    render(
      <MemoryRouter>
        <AdminAnalyticsDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Administrative Intelligence & Audit')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('metric-total-users')).toHaveTextContent('1,250');
      expect(screen.getByTestId('metric-published-schemes')).toHaveTextContent('48');
      expect(screen.getByTestId('metric-total-recommendations')).toHaveTextContent('4,200');
      expect(screen.getByTestId('metric-ocr-success-rate')).toHaveTextContent('94%');
    });
  });

  it('navigates to System Health tab and renders operational status', async () => {
    render(
      <MemoryRouter>
        <AdminAnalyticsDashboardPage />
      </MemoryRouter>
    );

    const healthTab = screen.getByRole('button', { name: /system health/i });
    fireEvent.click(healthTab);

    await waitFor(() => {
      expect(screen.getByTestId('system-health-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Platform Operational Status:')).toBeInTheDocument();
      expect(screen.getByText('Application API Gateway')).toBeInTheDocument();
    });
  });

  it('navigates to Audit Trail tab and displays logs', async () => {
    render(
      <MemoryRouter>
        <AdminAnalyticsDashboardPage />
      </MemoryRouter>
    );

    const auditTab = screen.getByRole('button', { name: /audit trail/i });
    fireEvent.click(auditTab);

    await waitFor(() => {
      expect(screen.getByTestId('audit-log-table-container')).toBeInTheDocument();
      expect(screen.getByText('SCHEME_PUBLISHED')).toBeInTheDocument();
    });
  });

  it('opens export modal when clicking Export Report button', async () => {
    render(
      <MemoryRouter>
        <AdminAnalyticsDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('metric-total-users')).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /export report/i });
    fireEvent.click(exportBtn);

    expect(
      screen.getByText('Export Administrative Analytics & Audit Trail')
    ).toBeInTheDocument();
  });
});
