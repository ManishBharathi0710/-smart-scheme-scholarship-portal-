import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import {
  SchemeAnalyticsDto,
  RecommendationAnalyticsDto,
  UserAnalyticsDto,
} from '../../../types/analytics';

export interface OverviewChartsProps {
  schemesData?: SchemeAnalyticsDto | null;
  recommendationsData?: RecommendationAnalyticsDto | null;
  usersData?: UserAnalyticsDto | null;
}

export const OverviewCharts: React.FC<OverviewChartsProps> = ({
  schemesData,
  recommendationsData,
  usersData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Scheme Discovery Funnel */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Scheme Discovery & Application Funnel
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Conversion from discovery views to official portal redirection
              </p>
            </div>
            {schemesData && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {schemesData.conversionRates.overallFunnelRate}% Total Conversion
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {schemesData ? (
            <div className="space-y-3.5">
              {/* Viewed */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>1. Scheme Catalog Views</span>
                  <span className="text-slate-900">{schemesData.funnel.viewed.toLocaleString()}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-full" />
                </div>
              </div>

              {/* Saved */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>2. Saved to Bookmarks ({schemesData.conversionRates.viewToSaveRate}% from Views)</span>
                  <span className="text-slate-900">{schemesData.funnel.saved.toLocaleString()}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        5,
                        Math.min(
                          100,
                          (schemesData.funnel.saved / (schemesData.funnel.viewed || 1)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Official Portal Redirections */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>
                    3. Official Portal Clicks ({schemesData.conversionRates.saveToApplyClickRate}% from Saved)
                  </span>
                  <span className="text-slate-900">
                    {schemesData.funnel.officialPortalClicked.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        3,
                        Math.min(
                          100,
                          (schemesData.funnel.officialPortalClicked / (schemesData.funnel.viewed || 1)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span>Total Active Published Schemes: <strong>{schemesData.totalPublished}</strong></span>
                <span>Open for Applications: <strong>{schemesData.openApplications}</strong></span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No funnel data available for this range.</p>
          )}
        </CardContent>
      </Card>

      {/* 2. Recommendation Eligibility Distribution */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">
            Eligibility Evaluation Distribution
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Rule engine results across active citizens
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendationsData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-xs font-semibold text-emerald-800">Eligible (Direct Match)</span>
                  <p className="text-xl font-bold text-emerald-900 mt-1">
                    {recommendationsData.distribution.eligible}
                  </p>
                  <span className="text-xs text-emerald-700">
                    {recommendationsData.distributionPercentages.eligible}% of evaluations
                  </span>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-xs font-semibold text-blue-800">Likely Eligible</span>
                  <p className="text-xl font-bold text-blue-900 mt-1">
                    {recommendationsData.distribution.likelyEligible}
                  </p>
                  <span className="text-xs text-blue-700">
                    {recommendationsData.distributionPercentages.likelyEligible}% of evaluations
                  </span>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="text-xs font-semibold text-amber-800">Needs Verification</span>
                  <p className="text-xl font-bold text-amber-900 mt-1">
                    {recommendationsData.distribution.needsVerification}
                  </p>
                  <span className="text-xs text-amber-700">
                    {recommendationsData.distributionPercentages.needsVerification}% of evaluations
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">Not Eligible</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {recommendationsData.distribution.notEligible}
                  </p>
                  <span className="text-xs text-slate-600">
                    {recommendationsData.distributionPercentages.notEligible}% of evaluations
                  </span>
                </div>
              </div>

              {recommendationsData.topCriteriaFailures.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Top Criteria Failures
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {recommendationsData.topCriteriaFailures.slice(0, 3).map((fail, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-slate-600">
                        <span className="truncate pr-2">{fail.condition}</span>
                        <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                          {fail.count} users
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No recommendation data available.</p>
          )}
        </CardContent>
      </Card>

      {/* 3. User Profile Completion Buckets */}
      {usersData && (
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">
              Profile Completion Readiness
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Citizen profile completion directly drives deterministic recommendation precision
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: '0–25%', count: usersData.profileCompletionBuckets['0_25'], color: 'bg-rose-500' },
                { label: '26–50%', count: usersData.profileCompletionBuckets['26_50'], color: 'bg-amber-500' },
                { label: '51–75%', count: usersData.profileCompletionBuckets['51_75'], color: 'bg-blue-500' },
                { label: '76–99%', count: usersData.profileCompletionBuckets['76_99'], color: 'bg-indigo-500' },
                { label: '100% Complete', count: usersData.profileCompletionBuckets['100'], color: 'bg-emerald-500' },
              ].map((bucket, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-700">{bucket.label}</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">{bucket.count}</p>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${bucket.color} rounded-full`}
                      style={{
                        width: `${Math.min(
                          100,
                          (bucket.count / (usersData.totalUsers || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
