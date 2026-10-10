import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  MapPin,
  GraduationCap,
  IndianRupee,
  Users,
  Briefcase,
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Save,
  Lock,
} from 'lucide-react';
import { profileApi } from '../api/profile.api';
import { authApi } from '../../auth/api/auth.api';
import { useAuth } from '../../auth/context/AuthContext';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Alert,
  Spinner,
} from '../../../components/ui';
import {
  Gender,
  AreaType,
  EducationLevel,
  InstitutionType,
  IncomeRange,
  SocialCategory,
  OccupationType,
  FarmerCategory,
  PreferenceCategory,
  ConsentType,
} from '../../../types/profile';

type TabKey =
  | 'personal'
  | 'location'
  | 'education'
  | 'financial'
  | 'social'
  | 'occupation'
  | 'preferences'
  | 'security';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Queries
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const { data: completion, isLoading: isCompletionLoading } = useQuery({
    queryKey: ['profile-completion'],
    queryFn: () => profileApi.getCompletion(),
  });

  // Local Form States
  const [personalForm, setPersonalForm] = useState<{
    fullName: string;
    age: string;
    gender: Gender;
    mobileNumber: string;
  }>({
    fullName: '',
    age: '',
    gender: 'PREFER_NOT_TO_SAY',
    mobileNumber: '',
  });

  const [locationForm, setLocationForm] = useState<{
    state: string;
    district: string;
    cityTown: string;
    pincode: string;
    areaType: AreaType;
  }>({
    state: '',
    district: '',
    cityTown: '',
    pincode: '',
    areaType: 'RURAL',
  });

  const [educationForm, setEducationForm] = useState<{
    educationLevel: EducationLevel;
    courseName: string;
    specialization: string;
    institutionType: InstitutionType;
    institutionName: string;
    yearOfStudy: string;
    academicPercentage: string;
    academicCgpa: string;
    passingYear: string;
  }>({
    educationLevel: 'UNDERGRADUATE',
    courseName: '',
    specialization: '',
    institutionType: 'GOVERNMENT',
    institutionName: '',
    yearOfStudy: '',
    academicPercentage: '',
    academicCgpa: '',
    passingYear: '',
  });

  const [financialForm, setFinancialForm] = useState<{
    annualFamilyIncome: string;
    incomeRange: IncomeRange;
    incomeSource: string;
    bplCardHolder: boolean;
  }>({
    annualFamilyIncome: '',
    incomeRange: 'BETWEEN_1_AND_2_5_LAKH',
    incomeSource: '',
    bplCardHolder: false,
  });

  const [socialForm, setSocialForm] = useState<{
    category: SocialCategory;
    minorityStatus: boolean;
    minorityCommunity: string;
    disabilityStatus: boolean;
    disabilityPercentage: string;
    disabilityType: string;
    isFirstGenerationGraduate: boolean;
    singleGirlChild: boolean;
    orphanStatus: boolean;
  }>({
    category: 'PREFER_NOT_TO_SAY',
    minorityStatus: false,
    minorityCommunity: '',
    disabilityStatus: false,
    disabilityPercentage: '',
    disabilityType: '',
    isFirstGenerationGraduate: false,
    singleGirlChild: false,
    orphanStatus: false,
  });

  const [occupationForm, setOccupationForm] = useState<{
    occupationType: OccupationType;
    employmentStatus: string;
    organizationName: string;
    farmerCategory: FarmerCategory;
  }>({
    occupationType: 'STUDENT',
    employmentStatus: '',
    organizationName: '',
    farmerCategory: 'NONE',
  });

  const [selectedPreferences, setSelectedPreferences] = useState<PreferenceCategory[]>([]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // Sync profile data to local forms when loaded
  React.useEffect(() => {
    if (profile) {
      setPersonalForm({
        fullName: profile.fullName || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || 'PREFER_NOT_TO_SAY',
        mobileNumber: profile.mobileNumber || '',
      });
      setLocationForm({
        state: profile.location?.state || '',
        district: profile.location?.district || '',
        cityTown: profile.location?.cityTown || '',
        pincode: profile.location?.pincode || '',
        areaType: profile.location?.areaType || 'RURAL',
      });
      setEducationForm({
        educationLevel: profile.education?.educationLevel || 'UNDERGRADUATE',
        courseName: profile.education?.courseName || '',
        specialization: profile.education?.specialization || '',
        institutionType: profile.education?.institutionType || 'GOVERNMENT',
        institutionName: profile.education?.institutionName || '',
        yearOfStudy: profile.education?.yearOfStudy?.toString() || '',
        academicPercentage: profile.education?.academicPercentage?.toString() || '',
        academicCgpa: profile.education?.academicCgpa?.toString() || '',
        passingYear: profile.education?.passingYear?.toString() || '',
      });
      setFinancialForm({
        annualFamilyIncome: profile.financial?.annualFamilyIncome?.toString() || '',
        incomeRange: profile.financial?.incomeRange || 'BETWEEN_1_AND_2_5_LAKH',
        incomeSource: profile.financial?.incomeSource || '',
        bplCardHolder: profile.financial?.bplCardHolder || false,
      });
      setSocialForm({
        category: profile.social?.category || 'PREFER_NOT_TO_SAY',
        minorityStatus: profile.social?.minorityStatus || false,
        minorityCommunity: profile.social?.minorityCommunity || '',
        disabilityStatus: profile.social?.disabilityStatus || false,
        disabilityPercentage: profile.social?.disabilityPercentage?.toString() || '',
        disabilityType: profile.social?.disabilityType || '',
        isFirstGenerationGraduate: profile.social?.isFirstGenerationGraduate || false,
        singleGirlChild: profile.social?.singleGirlChild || false,
        orphanStatus: profile.social?.orphanStatus || false,
      });
      setOccupationForm({
        occupationType: profile.occupation?.occupationType || 'STUDENT',
        employmentStatus: profile.occupation?.employmentStatus || '',
        organizationName: profile.occupation?.organizationName || '',
        farmerCategory: profile.occupation?.farmerCategory || 'NONE',
      });
      setSelectedPreferences(profile.preferences || []);
    }
  }, [profile]);

  // Mutations
  const updateSectionMutation = useMutation({
    mutationFn: async (section: string) => {
      if (section === 'personal') {
        return profileApi.updatePersonal({
          fullName: personalForm.fullName || null,
          age: personalForm.age ? parseInt(personalForm.age, 10) : null,
          gender: personalForm.gender,
          mobileNumber: personalForm.mobileNumber || null,
        });
      }
      if (section === 'location') {
        return profileApi.updateLocation({
          state: locationForm.state || null,
          district: locationForm.district || null,
          cityTown: locationForm.cityTown || null,
          pincode: locationForm.pincode || null,
          areaType: locationForm.areaType,
        });
      }
      if (section === 'education') {
        return profileApi.updateEducation({
          educationLevel: educationForm.educationLevel,
          courseName: educationForm.courseName || null,
          specialization: educationForm.specialization || null,
          institutionType: educationForm.institutionType,
          institutionName: educationForm.institutionName || null,
          yearOfStudy: educationForm.yearOfStudy ? parseInt(educationForm.yearOfStudy, 10) : null,
          academicPercentage: educationForm.academicPercentage ? parseFloat(educationForm.academicPercentage) : null,
          academicCgpa: educationForm.academicCgpa ? parseFloat(educationForm.academicCgpa) : null,
          passingYear: educationForm.passingYear ? parseInt(educationForm.passingYear, 10) : null,
        });
      }
      if (section === 'financial') {
        return profileApi.updateFinancial({
          annualFamilyIncome: financialForm.annualFamilyIncome ? parseFloat(financialForm.annualFamilyIncome) : null,
          incomeRange: financialForm.incomeRange,
          incomeSource: financialForm.incomeSource || null,
          bplCardHolder: financialForm.bplCardHolder,
        });
      }
      if (section === 'social') {
        return profileApi.updateSocial({
          category: socialForm.category,
          minorityStatus: socialForm.minorityStatus,
          minorityCommunity: socialForm.minorityCommunity || null,
          disabilityStatus: socialForm.disabilityStatus,
          disabilityPercentage: socialForm.disabilityPercentage ? parseInt(socialForm.disabilityPercentage, 10) : null,
          disabilityType: socialForm.disabilityType || null,
          isFirstGenerationGraduate: socialForm.isFirstGenerationGraduate,
          singleGirlChild: socialForm.singleGirlChild,
          orphanStatus: socialForm.orphanStatus,
        });
      }
      if (section === 'occupation') {
        return profileApi.updateOccupation({
          occupationType: occupationForm.occupationType,
          employmentStatus: occupationForm.employmentStatus || null,
          organizationName: occupationForm.organizationName || null,
          farmerCategory: occupationForm.farmerCategory,
        });
      }
      if (section === 'preferences') {
        return profileApi.updatePreferences(selectedPreferences);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-completion'] });
      setFeedback({ type: 'success', message: 'Profile details saved successfully.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to save profile changes.';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => authApi.changePassword(passwordForm),
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setFeedback({ type: 'success', message: 'Password changed successfully. All previous sessions invalidated.' });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to change password.';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const toggleConsentMutation = useMutation({
    mutationFn: ({ type, granted }: { type: ConsentType; granted: boolean }) =>
      profileApi.updateConsent(type, granted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setFeedback({ type: 'success', message: 'Privacy consent preferences updated.' });
    },
  });

  const togglePreference = (cat: PreferenceCategory) => {
    setSelectedPreferences((prev) =>
      prev.includes(cat) ? prev.filter((p) => p !== cat) : [...prev, cat],
    );
  };

  const allPreferencesList: { key: PreferenceCategory; label: string }[] = [
    { key: 'SCHOLARSHIPS', label: 'Scholarships' },
    { key: 'EDUCATION', label: 'Higher Education Assistance' },
    { key: 'LOANS', label: 'Educational & Micro Loans' },
    { key: 'SUBSIDIES', label: 'Fee Subsidies & Concessions' },
    { key: 'SKILL_DEVELOPMENT', label: 'Skill Training Programs' },
    { key: 'EMPLOYMENT', label: 'Employment & Internships' },
    { key: 'ENTREPRENEURSHIP', label: 'Startup & Self-Employment' },
    { key: 'AGRICULTURE', label: 'Agricultural & Farmer Welfare' },
    { key: 'HEALTHCARE', label: 'Healthcare & Medical Aid' },
    { key: 'INSURANCE', label: 'Social Security & Insurance' },
    { key: 'HOUSING', label: 'Housing Schemes' },
    { key: 'PENSION', label: 'Welfare Pensions' },
  ];

  if (isProfileLoading || isCompletionLoading) {
    return (
      <PageContainer className="py-20 text-center">
        <Spinner size="lg" label="Loading citizen profile..." />
      </PageContainer>
    );
  }

  const completionPct = completion?.overallPercentage || 0;

  return (
    <PageContainer className="py-8 space-y-6">
      {/* Citizen Header Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {profile?.fullName || 'Citizen Profile'}
            </h1>
            <Badge variant="info">{user?.role || 'CITIZEN'}</Badge>
            <Badge variant={user?.status === 'ACTIVE' ? 'success' : 'warning'}>
              {user?.status || 'ACTIVE'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Account: {user?.email} &bull; Member since{' '}
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2026'}
          </p>
        </div>

        {/* Profile Completion Meter */}
        <div className="min-w-[260px] bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700">Profile Completion</span>
            <span className="font-bold text-gov-800">{completionPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                completionPct >= 80
                  ? 'bg-emerald-600'
                  : completionPct >= 50
                  ? 'bg-gov-700'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            {completion?.isReadyForRecommendations ? (
              <span className="inline-flex items-center text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready for Recommendation Engine
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-700 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Add State, Education &amp; Income
              </span>
            )}
          </div>
        </div>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type === 'success' ? 'success' : 'error'}
          title={feedback.type === 'success' ? 'Success' : 'Error'}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Profile Section Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 bg-white p-1 rounded-t-lg shadow-sm">
        {(
          [
            { key: 'personal', label: 'Personal', icon: <User className="w-4 h-4" /> },
            { key: 'location', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
            { key: 'education', label: 'Education', icon: <GraduationCap className="w-4 h-4" /> },
            { key: 'financial', label: 'Financial', icon: <IndianRupee className="w-4 h-4" /> },
            { key: 'social', label: 'Social & Disability', icon: <Users className="w-4 h-4" /> },
            { key: 'occupation', label: 'Occupation', icon: <Briefcase className="w-4 h-4" /> },
            { key: 'preferences', label: 'Preferences', icon: <HeartHandshake className="w-4 h-4" /> },
            { key: 'security', label: 'Security & Consents', icon: <ShieldCheck className="w-4 h-4" /> },
          ] as { key: TabKey; label: string; icon: React.ReactNode }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setFeedback(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-gov-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT CARDS */}
      <Card className="rounded-t-none">
        {/* 1. PERSONAL INFORMATION */}
        {activeTab === 'personal' && (
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500">
                Basic identity attributes to determine age-bracket eligibility
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Manish Kumar"
                value={personalForm.fullName}
                onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
              />

              <Input
                label="Age (Years)"
                type="number"
                placeholder="e.g. 21"
                value={personalForm.age}
                onChange={(e) => setPersonalForm({ ...personalForm, age: e.target.value })}
              />

              <Select
                label="Gender"
                options={[
                  { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' },
                  { label: 'Male', value: 'MALE' },
                  { label: 'Female', value: 'FEMALE' },
                  { label: 'Transgender', value: 'TRANSGENDER' },
                  { label: 'Other', value: 'OTHER' },
                ]}
                value={personalForm.gender}
                onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value as Gender })}
              />

              <Input
                label="Mobile Number (Optional)"
                placeholder="10-digit mobile number"
                value={personalForm.mobileNumber}
                onChange={(e) => setPersonalForm({ ...personalForm, mobileNumber: e.target.value })}
              />
            </div>

            <Button
              variant="primary"
              onClick={() => updateSectionMutation.mutate('personal')}
              isLoading={updateSectionMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Save Personal Information
            </Button>
          </CardContent>
        )}

        {/* 2. LOCATION & RESIDENCE */}
        {activeTab === 'location' && (
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Geographic &amp; Residence Profile</h3>
              <p className="text-xs text-slate-500">
                Required to determine State and District level welfare schemes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="State / Union Territory"
                placeholder="e.g. Tamil Nadu, Karnataka, Delhi"
                value={locationForm.state}
                required
                onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
              />

              <Input
                label="District"
                placeholder="e.g. Coimbatore, Madurai, Bengaluru"
                value={locationForm.district}
                required
                onChange={(e) => setLocationForm({ ...locationForm, district: e.target.value })}
              />

              <Input
                label="City / Town / Village"
                placeholder="e.g. Pollachi"
                value={locationForm.cityTown}
                onChange={(e) => setLocationForm({ ...locationForm, cityTown: e.target.value })}
              />

              <Input
                label="Postal PIN Code"
                placeholder="6 digits (e.g. 642001)"
                value={locationForm.pincode}
                onChange={(e) => setLocationForm({ ...locationForm, pincode: e.target.value })}
              />

              <Select
                label="Area Classification"
                options={[
                  { label: 'Rural Area', value: 'RURAL' },
                  { label: 'Urban Area', value: 'URBAN' },
                  { label: 'Semi-Urban Area', value: 'SEMI_URBAN' },
                ]}
                value={locationForm.areaType}
                onChange={(e) => setLocationForm({ ...locationForm, areaType: e.target.value as AreaType })}
              />
            </div>

            <Button
              variant="primary"
              onClick={() => updateSectionMutation.mutate('location')}
              isLoading={updateSectionMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Save Location Information
            </Button>
          </CardContent>
        )}

        {/* 3. EDUCATION PROFILE */}
        {activeTab === 'education' && (
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Education &amp; Academic Qualifications</h3>
              <p className="text-xs text-slate-500">
                Matches merit-cum-means scholarships, post-matric schemes, and tuition concessions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Current / Highest Education Level"
                options={[
                  { label: 'Undergraduate (Degree / B.E. / B.Tech / B.Sc)', value: 'UNDERGRADUATE' },
                  { label: 'Higher Secondary (11th / 12th Standard)', value: 'HIGHER_SECONDARY' },
                  { label: 'School (Up to 10th Standard)', value: 'SCHOOL' },
                  { label: 'Diploma / Polytechnic', value: 'DIPLOMA' },
                  { label: 'Postgraduate (Master / M.Tech / M.Sc / MBA)', value: 'POSTGRADUATE' },
                  { label: 'Doctorate (Ph.D. / Research)', value: 'DOCTORATE' },
                  { label: 'ITI / Vocational', value: 'ITI' },
                  { label: 'Other', value: 'OTHER' },
                ]}
                value={educationForm.educationLevel}
                onChange={(e) =>
                  setEducationForm({ ...educationForm, educationLevel: e.target.value as EducationLevel })
                }
              />

              <Input
                label="Course / Degree Name"
                placeholder="e.g. B.E. Computer Science, 12th Biology"
                value={educationForm.courseName}
                onChange={(e) => setEducationForm({ ...educationForm, courseName: e.target.value })}
              />

              <Input
                label="Specialization / Department"
                placeholder="e.g. Artificial Intelligence, Science stream"
                value={educationForm.specialization}
                onChange={(e) => setEducationForm({ ...educationForm, specialization: e.target.value })}
              />

              <Select
                label="Institution Type"
                options={[
                  { label: 'Government Institution', value: 'GOVERNMENT' },
                  { label: 'Government Aided Institution', value: 'GOVERNMENT_AIDED' },
                  { label: 'Private / Self-Financing', value: 'PRIVATE' },
                  { label: 'Autonomous College', value: 'AUTONOMOUS' },
                  { label: 'Central University', value: 'CENTRAL_UNIVERSITY' },
                  { label: 'Deemed University', value: 'DEEMED_UNIVERSITY' },
                  { label: 'Other', value: 'OTHER' },
                ]}
                value={educationForm.institutionType}
                onChange={(e) =>
                  setEducationForm({ ...educationForm, institutionType: e.target.value as InstitutionType })
                }
              />

              <Input
                label="College / School Name"
                placeholder="e.g. Government College of Technology"
                value={educationForm.institutionName}
                onChange={(e) => setEducationForm({ ...educationForm, institutionName: e.target.value })}
              />

              <Input
                label="Current Year of Study"
                type="number"
                placeholder="e.g. 1, 2, 3, 4"
                value={educationForm.yearOfStudy}
                onChange={(e) => setEducationForm({ ...educationForm, yearOfStudy: e.target.value })}
              />

              <Input
                label="Academic Percentage (%)"
                type="number"
                step="0.01"
                placeholder="e.g. 84.5"
                value={educationForm.academicPercentage}
                onChange={(e) => setEducationForm({ ...educationForm, academicPercentage: e.target.value })}
              />

              <Input
                label="CGPA (Out of 10)"
                type="number"
                step="0.01"
                placeholder="e.g. 8.5"
                value={educationForm.academicCgpa}
                onChange={(e) => setEducationForm({ ...educationForm, academicCgpa: e.target.value })}
              />
            </div>

            <Button
              variant="primary"
              onClick={() => updateSectionMutation.mutate('education')}
              isLoading={updateSectionMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Save Academic Information
            </Button>
          </CardContent>
        )}

        {/* 4. FINANCIAL PROFILE */}
        {activeTab === 'financial' && (
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Financial Profile &amp; Annual Income</h3>
              <p className="text-xs text-slate-500">
                Used to evaluate schemes with statutory income ceilings (e.g. income &le; ₹2.5 lakh)
              </p>
            </div>

            {/* Data Minimization Notice */}
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-md flex items-start gap-2.5 text-xs text-sky-900">
              <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Why is this information requested?</strong> Government welfare programs and
                scholarships are targeted by annual family income. This value is used strictly by the
                deterministic rule engine to filter eligible schemes and is never sold or shared.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Annual Family Income (₹ in INR)"
                type="number"
                placeholder="e.g. 180000"
                value={financialForm.annualFamilyIncome}
                required
                onChange={(e) =>
                  setFinancialForm({ ...financialForm, annualFamilyIncome: e.target.value })
                }
              />

              <Select
                label="Income Bracket Range"
                options={[
                  { label: 'Below ₹1,00,000 (BPL / Economically Weak)', value: 'BELOW_1_LAKH' },
                  { label: '₹1,00,000 to ₹2,50,000', value: 'BETWEEN_1_AND_2_5_LAKH' },
                  { label: '₹2,50,000 to ₹5,00,000', value: 'BETWEEN_2_5_AND_5_LAKH' },
                  { label: '₹5,00,000 to ₹8,00,000 (EWS Limit)', value: 'BETWEEN_5_AND_8_LAKH' },
                  { label: 'Above ₹8,00,000', value: 'ABOVE_8_LAKH' },
                ]}
                value={financialForm.incomeRange}
                onChange={(e) =>
                  setFinancialForm({ ...financialForm, incomeRange: e.target.value as IncomeRange })
                }
              />

              <Input
                label="Primary Income Source"
                placeholder="e.g. Agriculture, Daily Wage, Private Salary"
                value={financialForm.incomeSource}
                onChange={(e) => setFinancialForm({ ...financialForm, incomeSource: e.target.value })}
              />

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={financialForm.bplCardHolder}
                    onChange={(e) =>
                      setFinancialForm({ ...financialForm, bplCardHolder: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gov-800 border-slate-300 focus:ring-gov-700"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    BPL (Below Poverty Line) / Antyodaya Card Holder
                  </span>
                </label>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => updateSectionMutation.mutate('financial')}
              isLoading={updateSectionMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Save Financial Information
            </Button>
          </CardContent>
        )}

        {/* 5. SOCIAL ELIGIBILITY */}
        {activeTab === 'social' && (
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Social Eligibility &amp; Special Categories</h3>
              <p className="text-xs text-slate-500">
                Affirmative action categories, minority assistance, and disability welfare criteria
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Social Category / Community"
                options={[
                  { label: 'Prefer not to say', value: 'PREFER_NOT_TO_SAY' },
                  { label: 'General / Unreserved', value: 'GENERAL' },
                  { label: 'OBC (Other Backward Classes)', value: 'OBC' },
                  { label: 'SC (Scheduled Castes)', value: 'SC' },
                  { label: 'ST (Scheduled Tribes)', value: 'ST' },
                  { label: 'EWS (Economically Weaker Section)', value: 'EWS' },
                  { label: 'Other', value: 'OTHER' },
                ]}
                value={socialForm.category}
                onChange={(e) =>
                  setSocialForm({ ...socialForm, category: e.target.value as SocialCategory })
                }
              />

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={socialForm.minorityStatus}
                    onChange={(e) =>
                      setSocialForm({ ...socialForm, minorityStatus: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gov-800 border-slate-300 focus:ring-gov-700"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Religious / Linguistic Minority Community
                  </span>
                </label>

                {socialForm.minorityStatus && (
                  <Input
                    label="Minority Community Name"
                    placeholder="e.g. Muslim, Christian, Sikh, Jain, Buddhist, Parsi"
                    value={socialForm.minorityCommunity}
                    onChange={(e) => setSocialForm({ ...socialForm, minorityCommunity: e.target.value })}
                  />
                )}
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4 md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={socialForm.disabilityStatus}
                    onChange={(e) =>
                      setSocialForm({ ...socialForm, disabilityStatus: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gov-800 border-slate-300 focus:ring-gov-700"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Person with Benchmark Disability (PwD)
                  </span>
                </label>

                {socialForm.disabilityStatus && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 pt-2">
                    <Input
                      label="Disability Percentage (%)"
                      type="number"
                      placeholder="e.g. 40"
                      value={socialForm.disabilityPercentage}
                      onChange={(e) =>
                        setSocialForm({ ...socialForm, disabilityPercentage: e.target.value })
                      }
                    />

                    <Input
                      label="Type of Disability"
                      placeholder="e.g. Locomotor, Visual, Hearing, Intellectual"
                      value={socialForm.disabilityType}
                      onChange={(e) =>
                        setSocialForm({ ...socialForm, disabilityType: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4 md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={socialForm.isFirstGenerationGraduate}
                    onChange={(e) =>
                      setSocialForm({ ...socialForm, isFirstGenerationGraduate: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gov-800 border-slate-300 focus:ring-gov-700"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    First Generation Graduate in Family
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={socialForm.singleGirlChild}
                    onChange={(e) =>
                      setSocialForm({ ...socialForm, singleGirlChild: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gov-800 border-slate-300 focus:ring-gov-700"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Single Girl Child (Special scholarships eligible)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={socialForm.orphanStatus}
                    onChange={(e) =>
                      setSocialForm({ ...socialForm, orphanStatus: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-gov-800 border-slate-300 focus:ring-gov-700"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Orphan / Ward of State
                  </span>
                </label>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => updateSectionMutation.mutate('social')}
              isLoading={updateSectionMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Save Social Eligibility Information
            </Button>
          </CardContent>
        )}

        {/* 6. OCCUPATION PROFILE */}
        {activeTab === 'occupation' && (
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Occupation &amp; Employment</h3>
              <p className="text-xs text-slate-500">
                Filters training programs, farmer subsidies, and employment welfare
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Current Occupation Status"
                options={[
                  { label: 'Student', value: 'STUDENT' },
                  { label: 'Employed (Private / Contract)', value: 'EMPLOYED' },
                  { label: 'Unemployed / Job Seeker', value: 'UNEMPLOYED' },
                  { label: 'Farmer / Cultivator', value: 'FARMER' },
                  { label: 'Self Employed / Artisan', value: 'SELF_EMPLOYED' },
                  { label: 'Business Owner / Entrepreneur', value: 'BUSINESS_OWNER' },
                  { label: 'Homemaker', value: 'HOMEMAKER' },
                  { label: 'Retired / Senior Citizen', value: 'RETIRED' },
                  { label: 'Other', value: 'OTHER' },
                ]}
                value={occupationForm.occupationType}
                onChange={(e) =>
                  setOccupationForm({ ...occupationForm, occupationType: e.target.value as OccupationType })
                }
              />

              {occupationForm.occupationType === 'FARMER' && (
                <Select
                  label="Farmer Classification"
                  options={[
                    { label: 'Marginal Farmer (Less than 1 hectare)', value: 'MARGINAL_FARMER' },
                    { label: 'Small Farmer (1 - 2 hectares)', value: 'SMALL_FARMER' },
                    { label: 'Large Farmer (More than 2 hectares)', value: 'LARGE_FARMER' },
                    { label: 'None / Landless Agricultural Laborer', value: 'NONE' },
                  ]}
                  value={occupationForm.farmerCategory}
                  onChange={(e) =>
                    setOccupationForm({
                      ...occupationForm,
                      farmerCategory: e.target.value as FarmerCategory,
                    })
                  }
                />
              )}

              <Input
                label="Organization / Company Name (Optional)"
                placeholder="e.g. Self, ABC Corp"
                value={occupationForm.organizationName}
                onChange={(e) =>
                  setOccupationForm({ ...occupationForm, organizationName: e.target.value })
                }
              />
            </div>

            <Button
              variant="primary"
              onClick={() => updateSectionMutation.mutate('occupation')}
              isLoading={updateSectionMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Save Occupation Information
            </Button>
          </CardContent>
        )}

        {/* 7. PREFERENCES */}
        {activeTab === 'preferences' && (
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Benefit Discovery Preferences</h3>
              <p className="text-xs text-slate-500">
                Select the categories you are interested in. Note: Preferences customize your discovery view, but do not dictate legal eligibility.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allPreferencesList.map((pref) => {
                const isSelected = selectedPreferences.includes(pref.key);
                return (
                  <button
                    key={pref.key}
                    type="button"
                    onClick={() => togglePreference(pref.key)}
                    className={`p-3 rounded-lg border text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-gov-900 text-white border-gov-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span>{pref.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              variant="primary"
              onClick={() => updateSectionMutation.mutate('preferences')}
              isLoading={updateSectionMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Save Preferences
            </Button>
          </CardContent>
        )}

        {/* 8. SECURITY & CONSENT MANAGEMENT */}
        {activeTab === 'security' && (
          <CardContent className="pt-6 space-y-8">
            {/* Change Password Form */}
            <div className="space-y-4 max-w-md">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gov-800" /> Change Portal Password
              </h3>
              <p className="text-xs text-slate-500">
                Updating your password will immediately revoke all other active refresh sessions.
              </p>

              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="At least 8 characters (letters + numbers)"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={passwordForm.confirmNewPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })
                }
              />

              <Button
                variant="primary"
                onClick={() => changePasswordMutation.mutate()}
                isLoading={changePasswordMutation.isPending}
              >
                Update Password
              </Button>
            </div>

            {/* Granular Consent Management */}
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Data Processing &amp; Consent Management</h3>
              <p className="text-xs text-slate-500">
                You retain complete control over your data. Revoking consent stops automated processing for that capability.
              </p>

              <div className="space-y-3">
                {[
                  {
                    type: 'PROFILE_PROCESSING' as ConsentType,
                    title: 'Profile Storage & Fact Extraction',
                    desc: 'Consent to maintain profile facts in secure PostgreSQL store.',
                  },
                  {
                    type: 'RECOMMENDATION_PROCESSING' as ConsentType,
                    title: 'Deterministic Eligibility Matching',
                    desc: 'Consent for the rule engine to test stored facts against government eligibility criteria.',
                  },
                ].map((item) => {
                  const consentObj = profile?.consents.find((c) => c.consentType === item.type);
                  const isGranted = consentObj?.granted ?? false;
                  return (
                    <div
                      key={item.type}
                      className="p-4 rounded-lg border border-slate-200 flex items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        {consentObj?.grantedAt && (
                          <span className="text-[10px] text-slate-400">
                            Granted at: {new Date(consentObj.grantedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={isGranted ? 'outline' : 'primary'}
                        onClick={() =>
                          toggleConsentMutation.mutate({ type: item.type, granted: !isGranted })
                        }
                      >
                        {isGranted ? 'Revoke Consent' : 'Grant Consent'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </PageContainer>
  );
};
