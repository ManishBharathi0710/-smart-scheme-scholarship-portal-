import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '../layouts/RootLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { SchemesCatalogPage } from '../features/schemes/pages/SchemesCatalogPage';
import { SchemeDetailPage } from '../features/schemes/pages/SchemeDetailPage';
import { AdminSchemesListPage } from '../features/schemes/pages/AdminSchemesListPage';
import { AdminSchemeFormPage } from '../features/schemes/pages/AdminSchemeFormPage';
import { RecommendationsPage } from '../features/recommendations/pages/RecommendationsPage';
import { RecommendationDetailPage } from '../features/recommendations/pages/RecommendationDetailPage';
import { SavedSchemesPage } from '../features/saved-schemes/pages/SavedSchemesPage';
import { CompareSchemesPage } from '../features/schemes/pages/CompareSchemesPage';
import { DocumentsPage } from '../features/documents/pages/DocumentsPage';
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage';
import { NotificationSettingsPage } from '../features/notifications/pages/NotificationSettingsPage';
import { AssistantPage } from '../features/assistant/pages/AssistantPage';
import { AdminAnalyticsDashboardPage } from '../features/analytics/pages/AdminAnalyticsDashboardPage';
import { AdminAuditLogsPage } from '../features/analytics/pages/AdminAuditLogsPage';
import { AdminSystemHealthPage } from '../features/analytics/pages/AdminSystemHealthPage';

/**
 * Application Route Tree
 * Module 1 established route architecture and layout hierarchy.
 * Module 2 mounts Authentication & User Profile routes with ProtectedRoute enforcement.
 * Module 3 mounts Scheme & Scholarship Management routes (Public discovery + Admin management & verification).
 * Module 4 mounts Deterministic Rule-Based Recommendation routes.
 * Module 5 mounts Discovery, Saved Schemes & Multi-Scheme Comparison routes.
 * Module 6 mounts Document Vault & Verification Readiness.
 * Module 7 mounts Citizen Notifications, Deadline Reminders & Alert Preferences.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      // Module 2 Citizen Authentication Routes
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      // Module 2 Protected Citizen Dashboard & Profile Routes
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      // Module 6 Protected Citizen Document Vault & Readiness
      {
        path: 'documents',
        element: (
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        ),
      },
      // Module 7 Protected Citizen Notifications & Alert Preferences
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/notifications',
        element: (
          <ProtectedRoute>
            <NotificationSettingsPage />
          </ProtectedRoute>
        ),
      },
      // Module 8 AI Assistant & Grounded Scheme Guidance
      {
        path: 'assistant',
        element: (
          <ProtectedRoute>
            <AssistantPage />
          </ProtectedRoute>
        ),
      },
      // Module 3 Public Scheme Discovery Routes
      {
        path: 'schemes',
        element: <SchemesCatalogPage />,
      },
      {
        path: 'schemes/:idOrSlug',
        element: <SchemeDetailPage />,
      },
      // Module 3 Admin Scheme Management & Verification Routes
      {
        path: 'admin/schemes',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SCHEME_MANAGER', 'VERIFIER', 'SUPER_ADMIN']}>
            <AdminSchemesListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/schemes/new',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SCHEME_MANAGER', 'SUPER_ADMIN']}>
            <AdminSchemeFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/schemes/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SCHEME_MANAGER', 'SUPER_ADMIN']}>
            <AdminSchemeFormPage />
          </ProtectedRoute>
        ),
      },
      // Module 9 Administrative Analytics, Audit & Health Monitoring (Protected)
      {
        path: 'admin/analytics',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SCHEME_MANAGER', 'VERIFIER', 'SUPER_ADMIN']}>
            <AdminAnalyticsDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/audit-logs',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminAuditLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/system-health',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminSystemHealthPage />
          </ProtectedRoute>
        ),
      },
      // Module 4 Rule-Based Recommendation Routes (Protected)
      {
        path: 'recommendations',
        element: (
          <ProtectedRoute>
            <RecommendationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'recommendations/:id',
        element: (
          <ProtectedRoute>
            <RecommendationDetailPage />
          </ProtectedRoute>
        ),
      },
      // Module 5 Citizen Saved Schemes & Comparison Routes
      {
        path: 'saved',
        element: (
          <ProtectedRoute>
            <SavedSchemesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'schemes/saved',
        element: (
          <ProtectedRoute>
            <SavedSchemesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'compare',
        element: <CompareSchemesPage />,
      },
      {
        path: 'schemes/compare',
        element: <CompareSchemesPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

