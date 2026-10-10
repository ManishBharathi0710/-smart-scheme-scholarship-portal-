import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Mail,
  Calendar,
  FileCheck,
  Sparkles,
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { UpdateNotificationPreferencesInput } from '../../../types/notification';

export const NotificationSettingsPage: React.FC = () => {
  const {
    preferences,
    loading,
    saving,
    error,
    successMessage,
    updatePreferences,
  } = useNotificationPreferences();

  const [formState, setFormState] = useState<UpdateNotificationPreferencesInput>({
    deadlineReminders: true,
    schemeUpdates: true,
    recommendationUpdates: true,
    documentAlerts: true,
    emailEnabled: true,
    inAppEnabled: true,
  });

  useEffect(() => {
    if (preferences) {
      setFormState({
        deadlineReminders: preferences.deadlineReminders,
        schemeUpdates: preferences.schemeUpdates,
        recommendationUpdates: preferences.recommendationUpdates,
        documentAlerts: preferences.documentAlerts,
        emailEnabled: preferences.emailEnabled,
        inAppEnabled: preferences.inAppEnabled,
      });
    }
  }, [preferences]);

  const handleToggle = (key: keyof UpdateNotificationPreferencesInput) => {
    setFormState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePreferences(formState);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        to="/notifications"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gov-900 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Notifications</span>
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gov-950 flex items-center gap-2">
          <span>Notification &amp; Alert Preferences</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Customize which government scheme updates and deadline reminders you want to receive.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Categories Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-gov-900 uppercase tracking-wider">
              Alert Categories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the topics for which you would like to be notified.
            </p>
          </div>

          <div className="divide-y divide-slate-100 p-2 sm:p-4">
            {/* Deadline Reminders */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 pr-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="toggle-deadlines"
                    className="text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    Application Deadline Reminders
                  </label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Receive timely reminders 7 days, 3 days, 1 day before, and on deadline day for saved or recommended schemes.
                  </p>
                </div>
              </div>
              <input
                id="toggle-deadlines"
                type="checkbox"
                checked={formState.deadlineReminders ?? true}
                onChange={() => handleToggle('deadlineReminders')}
                className="w-5 h-5 rounded text-gov-800 focus:ring-gov-700 cursor-pointer"
              />
            </div>

            {/* Scheme Updates */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 pr-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="toggle-scheme-updates"
                    className="text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    Saved Scheme Updates
                  </label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Get alerted when administering departments update benefits, requirements, or application windows.
                  </p>
                </div>
              </div>
              <input
                id="toggle-scheme-updates"
                type="checkbox"
                checked={formState.schemeUpdates ?? true}
                onChange={() => handleToggle('schemeUpdates')}
                className="w-5 h-5 rounded text-gov-800 focus:ring-gov-700 cursor-pointer"
              />
            </div>

            {/* Recommendation Updates */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 pr-4">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="toggle-recommendations"
                    className="text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    Recommendation Updates
                  </label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Notify me when new scheme recommendations match my citizen profile or when verification info is needed.
                  </p>
                </div>
              </div>
              <input
                id="toggle-recommendations"
                type="checkbox"
                checked={formState.recommendationUpdates ?? true}
                onChange={() => handleToggle('recommendationUpdates')}
                className="w-5 h-5 rounded text-gov-800 focus:ring-gov-700 cursor-pointer"
              />
            </div>

            {/* Document Alerts */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 pr-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="toggle-document-alerts"
                    className="text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    Document Expiry &amp; Processing Alerts
                  </label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Receive alerts when your documents are ready for review, processing completes, or certificates are expiring.
                  </p>
                </div>
              </div>
              <input
                id="toggle-document-alerts"
                type="checkbox"
                checked={formState.documentAlerts ?? true}
                onChange={() => handleToggle('documentAlerts')}
                className="w-5 h-5 rounded text-gov-800 focus:ring-gov-700 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Channels Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-bold text-gov-900 uppercase tracking-wider">
              Delivery Channels
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control where notifications are delivered.
            </p>
          </div>

          <div className="divide-y divide-slate-100 p-2 sm:p-4">
            {/* In-App Notifications */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 pr-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="toggle-inapp"
                    className="text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    In-App Notification Center
                  </label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Show notification bell badge and display updates in the portal dashboard.
                  </p>
                </div>
              </div>
              <input
                id="toggle-inapp"
                type="checkbox"
                checked={formState.inAppEnabled ?? true}
                onChange={() => handleToggle('inAppEnabled')}
                className="w-5 h-5 rounded text-gov-800 focus:ring-gov-700 cursor-pointer"
              />
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3 pr-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="toggle-email"
                    className="text-sm font-semibold text-slate-800 cursor-pointer"
                  >
                    Email Notifications
                  </label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Send important scheme deadlines and document alerts to your registered citizen email.
                  </p>
                </div>
              </div>
              <input
                id="toggle-email"
                type="checkbox"
                checked={formState.emailEnabled ?? true}
                onChange={() => handleToggle('emailEnabled')}
                className="w-5 h-5 rounded text-gov-800 focus:ring-gov-700 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Security Alert notice */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
          <Shield className="w-4 h-4 text-gov-800 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Security &amp; Account Notice:</span> Security
            alerts (such as password changes, authentication verification, and statutory system notices)
            are mandatory and cannot be disabled.
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/notifications"
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold text-white bg-gov-900 hover:bg-gov-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving Preferences...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
