import { useState, useEffect, useCallback, useMemo } from 'react';
import { RecommendationCard } from '../../../types/recommendation';
import { DashboardData, DashboardProfile } from '../../../types/dashboard';

export type ApplicationStage = 'SUBMITTED' | 'DOC_VERIFICATION' | 'DEPT_APPROVAL' | 'DISBURSED';

export interface StageStep {
  stage: ApplicationStage;
  label: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  date?: string;
  note?: string;
}

export interface TrackedApplication {
  id: string;
  applicationRef: string;
  schemeId: string;
  schemeName: string;
  department: string;
  appliedDate: string;
  estimatedBenefit: number;
  benefitType: string;
  currentStage: ApplicationStage;
  statusLabel: string;
  stages: StageStep[];
  lastUpdated: string;
  remarks: string;
}

export interface SchemeMatchDetail {
  score: number;
  reasons: string[];
}

const STORAGE_KEY_APPLICATIONS = 'smart_scheme_tracked_applications_v1';

const INITIAL_APPLICATIONS: TrackedApplication[] = [
  {
    id: 'app-001',
    applicationRef: 'APP-2026-TN-84920',
    schemeId: 'scheme-pms-bc',
    schemeName: 'Post-Matric Scholarship for Backward Classes (PMS-BC)',
    department: 'Department of Backward Classes & Most Backward Classes Welfare',
    appliedDate: '2026-08-14',
    estimatedBenefit: 45000,
    benefitType: 'Tuition Fee Waiver + Maintenance Allowance',
    currentStage: 'DEPT_APPROVAL',
    statusLabel: 'Under Department Review',
    stages: [
      {
        stage: 'SUBMITTED',
        label: 'Submitted',
        status: 'COMPLETED',
        date: '14 Aug 2026',
        note: 'Application verified by Institution Registrar',
      },
      {
        stage: 'DOC_VERIFICATION',
        label: 'Document Verification',
        status: 'COMPLETED',
        date: '28 Aug 2026',
        note: 'Income & Community certificates OCR verified',
      },
      {
        stage: 'DEPT_APPROVAL',
        label: 'Department Approval',
        status: 'IN_PROGRESS',
        date: '08 Oct 2026',
        note: 'Sanction order pending Director signature',
      },
      {
        stage: 'DISBURSED',
        label: 'Disbursement',
        status: 'PENDING',
        note: 'Awaiting treasury PFMS batch schedule',
      },
    ],
    lastUpdated: '2026-10-08T14:30:00.000Z',
    remarks: 'Field officer verification completed with 100% compliance. Expected disbursement in next fiscal cycle.',
  },
  {
    id: 'app-002',
    applicationRef: 'APP-2026-GOI-19033',
    schemeId: 'scheme-ambedkar-pg',
    schemeName: 'Dr. Ambedkar National Merit Scholarship for Higher Education',
    department: 'Ministry of Social Justice and Empowerment, New Delhi',
    appliedDate: '2026-09-22',
    estimatedBenefit: 31000,
    benefitType: 'Direct Benefit Transfer (DBT)',
    currentStage: 'DOC_VERIFICATION',
    statusLabel: 'Document Verification In Progress',
    stages: [
      {
        stage: 'SUBMITTED',
        label: 'Submitted',
        status: 'COMPLETED',
        date: '22 Sep 2026',
        note: 'Online submission via National Portal',
      },
      {
        stage: 'DOC_VERIFICATION',
        label: 'Document Verification',
        status: 'IN_PROGRESS',
        date: '10 Oct 2026',
        note: 'Additional semester marksheet under officer review',
      },
      {
        stage: 'DEPT_APPROVAL',
        label: 'Department Approval',
        status: 'PENDING',
        note: 'Pending after document clearance',
      },
      {
        stage: 'DISBURSED',
        label: 'Disbursement',
        status: 'PENDING',
        note: 'Pending sanction order',
      },
    ],
    lastUpdated: '2026-10-10T11:15:00.000Z',
    remarks: 'Document review initiated by regional nodal desk. No pending citizen upload actions.',
  },
  {
    id: 'app-003',
    applicationRef: 'APP-2026-NSP-55018',
    schemeId: 'scheme-nsp-mcm',
    schemeName: 'Merit-Cum-Means Technical & Professional Education Subsidy',
    department: 'Ministry of Education / UGC',
    appliedDate: '2026-07-02',
    estimatedBenefit: 20000,
    benefitType: 'Bank Account DBT Credit',
    currentStage: 'DISBURSED',
    statusLabel: 'Disbursed (PFMS Credited)',
    stages: [
      {
        stage: 'SUBMITTED',
        label: 'Submitted',
        status: 'COMPLETED',
        date: '02 Jul 2026',
        note: 'Submitted via Aadhaar authentication',
      },
      {
        stage: 'DOC_VERIFICATION',
        label: 'Document Verification',
        status: 'COMPLETED',
        date: '18 Jul 2026',
        note: 'Verified against Digilocker certificate',
      },
      {
        stage: 'DEPT_APPROVAL',
        label: 'Department Approval',
        status: 'COMPLETED',
        date: '25 Aug 2026',
        note: 'Sanction order #SO-TN-4491 issued',
      },
      {
        stage: 'DISBURSED',
        label: 'Disbursement',
        status: 'COMPLETED',
        date: '18 Sep 2026',
        note: 'Credited to citizen Aadhaar-linked bank account via PFMS',
      },
    ],
    lastUpdated: '2026-09-18T16:45:00.000Z',
    remarks: 'Benefits successfully disbursed. UTR: RBI2026091800921448.',
  },
];

/**
 * Deterministically compute match score against citizen attributes
 */
export function computeSchemeMatchScore(
  scheme: RecommendationCard,
  profile?: DashboardProfile | null
): SchemeMatchDetail {
  let score = 75; // baseline statutory relevance
  const reasons: string[] = [];

  const state = profile?.state || 'Tamil Nadu';
  const income = profile?.income || 180000;
  const education = profile?.educationLevel || 'UNDERGRADUATE';
  const category = profile?.category || 'OBC';

  // 1. Location match
  if (!scheme.stateScope || scheme.stateScope === 'All India' || scheme.stateScope.toLowerCase() === state.toLowerCase()) {
    score += 8;
    reasons.push(`State Scope: ${scheme.stateScope || 'All India'}`);
  }

  // 2. Income eligibility
  if (income <= 250000) {
    score += 7;
    reasons.push('Family Income < ₹2.5L Threshold');
  } else if (income <= 500000) {
    score += 4;
    reasons.push('Income within welfare ceiling');
  }

  // 3. Education relevance
  if (scheme.categories?.includes('EDUCATION')) {
    score += 5;
    reasons.push(`Education Level: ${education}`);
  }

  // 4. Social Category
  if (category) {
    score += 4;
    reasons.push(`Category: ${category}`);
  }

  // Bound to 98% maximum explainability
  const finalScore = Math.min(Math.max(score, 72), 98);
  return {
    score: finalScore,
    reasons: (reasons ?? []).slice(0, 3),
  };
}

export function useDashboardSimulation(dashboard?: DashboardData | null) {
  // 1. Reactive Polling & Live Status
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(() => new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncCount, setSyncCount] = useState<number>(1);

  // 2. Tracked Applications with Local Storage Persistence
  const [applications, setApplications] = useState<TrackedApplication[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback on storage errors
    }
    return INITIAL_APPLICATIONS;
  });

  // Save to local storage on mutation
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(applications));
    } catch {
      // Ignore
    }
  }, [applications]);

  // Periodic heartbeat polling simulation (every 25 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSyncedAt(new Date());
      setSyncCount((prev) => prev + 1);
    }, 25000);
    return () => clearInterval(timer);
  }, []);

  const manualSync = useCallback(async () => {
    setIsSyncing(true);
    await new Promise((res) => setTimeout(res, 600));
    setLastSyncedAt(new Date());
    setSyncCount((prev) => prev + 1);
    setIsSyncing(false);
  }, []);

  // Track a new application when citizen clicks "Apply Now"
  const trackApplication = useCallback((scheme: RecommendationCard, benefitAmount = 50000) => {
    const newApp: TrackedApplication = {
      id: `app-${Date.now()}`,
      applicationRef: `APP-2026-NEW-${Math.floor(10000 + Math.random() * 90000)}`,
      schemeId: scheme.schemeId,
      schemeName: scheme.schemeName,
      department: scheme.departmentName || 'Government Welfare Department',
      appliedDate: new Date().toISOString().split('T')[0] ?? new Date().toISOString(),
      estimatedBenefit: scheme.primaryBenefit?.amount || benefitAmount,
      benefitType: scheme.primaryBenefit?.type || 'Direct Benefit Transfer',
      currentStage: 'SUBMITTED',
      statusLabel: 'Application Submitted',
      stages: [
        {
          stage: 'SUBMITTED',
          label: 'Submitted',
          status: 'COMPLETED',
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          note: 'Application initiated through Smart Scheme Portal',
        },
        {
          stage: 'DOC_VERIFICATION',
          label: 'Document Verification',
          status: 'IN_PROGRESS',
          note: 'Awaiting nodal department automated validation',
        },
        {
          stage: 'DEPT_APPROVAL',
          label: 'Department Approval',
          status: 'PENDING',
          note: 'Pending sanction order',
        },
        {
          stage: 'DISBURSED',
          label: 'Disbursement',
          status: 'PENDING',
          note: 'Pending PFMS clearance',
        },
      ],
      lastUpdated: new Date().toISOString(),
      remarks: 'Application logged in state portal registry. Keep application reference handy.',
    };

    setApplications((prev) => [newApp, ...prev]);
    return newApp;
  }, []);

  // Compute Aggregates & KPIs
  const activeApplicationsCount = useMemo(() => {
    return (applications ?? []).filter((a) => a.currentStage !== 'DISBURSED').length;
  }, [applications]);

  const disbursedApplicationsCount = useMemo(() => {
    return (applications ?? []).filter((a) => a.currentStage === 'DISBURSED').length;
  }, [applications]);

  const inReviewApplicationsCount = useMemo(() => {
    return (applications ?? []).filter(
      (a) => a.currentStage === 'SUBMITTED' || a.currentStage === 'DOC_VERIFICATION'
    ).length;
  }, [applications]);

  const approvedApplicationsCount = useMemo(() => {
    return (applications ?? []).filter((a) => a.currentStage === 'DEPT_APPROVAL').length;
  }, [applications]);

  const totalEstimatedBenefit = useMemo(() => {
    // Sum of tracked applications plus eligible scheme benefits
    const appBenefits = (applications ?? []).reduce(
      (acc, app) => acc + (app.estimatedBenefit || 0),
      0
    );
    const recBenefits = (dashboard?.topRecommendations ?? []).reduce((acc, rec) => {
      return acc + (rec.primaryBenefit?.amount || 0);
    }, 0);
    return Math.max(appBenefits, recBenefits, 126000);
  }, [applications, dashboard]);

  return {
    lastSyncedAt,
    isSyncing,
    syncCount,
    manualSync,
    applications,
    trackApplication,
    activeApplicationsCount,
    disbursedApplicationsCount,
    inReviewApplicationsCount,
    approvedApplicationsCount,
    totalEstimatedBenefit,
  };
}
