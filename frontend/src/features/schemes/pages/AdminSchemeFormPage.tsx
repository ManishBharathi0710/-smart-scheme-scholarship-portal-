import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';
import { schemesApi } from '../api/schemes.api';
import {
  ProgramType,
  SchemeCategory,
  ApplicationMethod,
  BenefitType,
  BenefitFrequency,
  RuleOperator,
  RULE_FIELD_CATALOG,
  BenefitItem,
  DocumentRequirementItem,
  ApplicationPeriodItem,
  EligibilityRuleItem,
} from '../../../types/scheme';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Spinner,
  Alert,
} from '../../../components/ui';

export const AdminSchemeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    'basic' | 'content' | 'benefits' | 'documents' | 'periods' | 'rules'
  >('basic');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [programType, setProgramType] = useState<ProgramType>('SCHOLARSHIP');
  const [categories, setCategories] = useState<SchemeCategory[]>(['EDUCATION']);
  const [departmentId, setDepartmentId] = useState('');
  const [ministry, setMinistry] = useState('');
  const [stateScope, setStateScope] = useState('ALL_INDIA');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [officialSourceUrl, setOfficialSourceUrl] = useState('');
  const [officialApplicationUrl, setOfficialApplicationUrl] = useState('');
  const [applicationMethod, setApplicationMethod] = useState<ApplicationMethod>('ONLINE');
  const [applicationInstructions, setApplicationInstructions] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  // Collections
  const [benefits, setBenefits] = useState<BenefitItem[]>([
    {
      benefitType: 'SCHOLARSHIP',
      amount: 25000,
      frequency: 'ANNUAL',
      description: 'Annual scholarship allowance',
      isVariable: false,
    },
  ]);

  const [documents, setDocuments] = useState<DocumentRequirementItem[]>([
    {
      documentType: 'INCOME_CERTIFICATE',
      name: 'Income Certificate',
      mandatory: true,
      description: 'Issued by competent Revenue Authority within 1 year',
    },
  ]);

  const [applicationPeriods, setApplicationPeriods] = useState<ApplicationPeriodItem[]>([
    {
      title: 'AY 2026-27 Application Cycle',
      academicYear: '2026-2027',
      status: 'OPEN',
    },
  ]);

  const [rules, setRules] = useState<EligibilityRuleItem[]>([
    {
      field: 'annual_family_income',
      operator: 'LESS_THAN_OR_EQUAL',
      value: 250000,
      dataType: 'NUMBER',
      mandatory: true,
      description: 'Annual family income must not exceed ₹2,50,000.',
    },
  ]);

  // Rule Builder Temporary State
  const [selectedField, setSelectedField] = useState('annual_family_income');
  const [selectedOperator, setSelectedOperator] = useState<RuleOperator>('LESS_THAN_OR_EQUAL');
  const [ruleValue, setRuleValue] = useState<string>('250000');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleMandatory, setRuleMandatory] = useState(true);

  // Queries
  const { data: filterMeta } = useQuery({
    queryKey: ['schemes-filter-meta'],
    queryFn: () => schemesApi.getFilterMetadata(),
  });

  const { data: existingScheme, isLoading: isSchemeLoading } = useQuery({
    queryKey: ['admin-scheme-detail', id],
    queryFn: () => schemesApi.getSchemeByIdAdmin(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingScheme) {
      setName(existingScheme.name);
      setShortName(existingScheme.shortName || '');
      setProgramType(existingScheme.programType);
      setCategories(existingScheme.categories);
      setDepartmentId(existingScheme.department.id);
      setMinistry(existingScheme.ministry || '');
      setStateScope(existingScheme.stateScope);
      setDescription(existingScheme.description);
      setShortDescription(existingScheme.shortDescription || '');
      setOfficialSourceUrl(existingScheme.officialSourceUrl);
      setOfficialApplicationUrl(existingScheme.officialApplicationUrl || '');
      setApplicationMethod(existingScheme.applicationMethod);
      setApplicationInstructions(existingScheme.applicationInstructions || '');
      setReferenceNumber(existingScheme.referenceNumber || '');
      setBenefits(existingScheme.benefits || []);
      setDocuments(existingScheme.documents || []);
      setApplicationPeriods(existingScheme.applicationPeriods || []);
      setRules(existingScheme.rawRules || []);
    } else if (filterMeta?.departments?.[0] && !departmentId) {
      setDepartmentId(filterMeta.departments[0].id);
    }
  }, [existingScheme, filterMeta, departmentId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => schemesApi.createScheme(data),
    onSuccess: (_res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
      navigate('/admin/schemes');
    },
    onError: (err: unknown) => {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to create scheme draft.',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => schemesApi.updateScheme(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schemes'] });
      setFeedback({ type: 'success', message: 'Scheme and version snapshot updated successfully.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: unknown) => {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update scheme.',
      });
    },
  });

  // Handle Adding Rule
  const handleAddRule = () => {
    const catalogEntry = RULE_FIELD_CATALOG[selectedField];
    if (!catalogEntry) return;

    let parsedValue: unknown = ruleValue;
    if (catalogEntry.dataType === 'NUMBER') {
      parsedValue = Number(ruleValue);
    } else if (catalogEntry.dataType === 'BOOLEAN') {
      parsedValue = ruleValue === 'true';
    }

    const desc =
      ruleDescription.trim() ||
      `${catalogEntry.label} must be ${selectedOperator.replace(/_/g, ' ').toLowerCase()} ${ruleValue}.`;

    setRules((prev) => [
      ...prev,
      {
        field: selectedField,
        operator: selectedOperator,
        value: parsedValue,
        dataType: catalogEntry.dataType,
        mandatory: ruleMandatory,
        description: desc,
        order: prev.length + 1,
      },
    ]);

    setRuleDescription('');
  };

  const removeRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isEditMode && !changeSummary.trim()) {
      setFeedback({
        type: 'error',
        message: 'A brief change summary is required for version audit history.',
      });
      setActiveTab('basic');
      return;
    }

    const payload = {
      name,
      shortName: shortName || undefined,
      programType,
      categories,
      departmentId,
      ministry: ministry || undefined,
      stateScope,
      description,
      shortDescription: shortDescription || undefined,
      officialSourceUrl,
      officialApplicationUrl: officialApplicationUrl || undefined,
      applicationMethod,
      applicationInstructions: applicationInstructions || undefined,
      referenceNumber: referenceNumber || undefined,
      benefits,
      documents,
      applicationPeriods,
      eligibilityRules: rules,
      ...(isEditMode && { changeSummary }),
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEditMode && isSchemeLoading) {
    return (
      <PageContainer className="py-20 text-center">
        <Spinner size="lg" label="Loading scheme record..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/admin/schemes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gov-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Schemes Management</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditMode ? `Edit Scheme: ${name}` : 'Register New Scheme Draft'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Specify verified department facts, structured benefits, and machine-readable eligibility requirements.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          variant="primary"
          isLoading={createMutation.isPending || updateMutation.isPending}
          className="text-xs font-bold shadow-sm"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {isEditMode ? 'Update Scheme & New Version' : 'Save Scheme Draft'}
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type === 'success' ? 'success' : 'error'}>
          {feedback.message}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 bg-white p-1 rounded-t-lg shadow-sm text-xs font-semibold">
        {[
          { key: 'basic', label: '1. Basic Information' },
          { key: 'content', label: '2. Description & URLs' },
          { key: 'benefits', label: '3. Benefits Provisions' },
          { key: 'periods', label: '4. Application Cycles' },
          { key: 'documents', label: '5. Required Documents' },
          { key: 'rules', label: '6. Eligibility Rule Builder' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as 'basic' | 'content' | 'benefits' | 'periods' | 'documents' | 'rules')}
            className={`px-3.5 py-2 rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-gov-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TAB 1: BASIC INFORMATION */}
            {activeTab === 'basic' && (
              <div className="space-y-4 max-w-3xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Scheme Name *
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Post-Matric Scholarship for Backward Classes"
                    required
                    className="text-xs sm:text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Short Name / Acronym
                    </label>
                    <Input
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      placeholder="e.g. PMS-BC"
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Program Type *
                    </label>
                    <Select
                      value={programType}
                      onChange={(e) => setProgramType(e.target.value as ProgramType)}
                      className="text-xs"
                    >
                      {filterMeta?.programTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Administering Department *
                    </label>
                    <Select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="text-xs"
                      required
                    >
                      <option value="">Select Department</option>
                      {filterMeta?.departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.level})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State Scope *
                    </label>
                    <Input
                      value={stateScope}
                      onChange={(e) => setStateScope(e.target.value)}
                      placeholder="e.g. Tamil Nadu or ALL_INDIA"
                      required
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ministry / Parent Organization
                  </label>
                  <Input
                    value={ministry}
                    onChange={(e) => setMinistry(e.target.value)}
                    placeholder="e.g. Ministry of Social Justice & Empowerment"
                    className="text-xs"
                  />
                </div>

                {isEditMode && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      Version Change Summary * (Required for audit history)
                    </label>
                    <Input
                      value={changeSummary}
                      onChange={(e) => setChangeSummary(e.target.value)}
                      placeholder="e.g., Increased income ceiling to ₹2.5 lakh as per notification dated 15 Oct 2026"
                      className="text-xs"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CONTENT & APPLICATION URLS */}
            {activeTab === 'content' && (
              <div className="space-y-4 max-w-3xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Short Description (Summary Card) *
                  </label>
                  <Input
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief 1-2 sentence description for search cards"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detailed Scheme Description &amp; Objectives *
                  </label>
                  <Textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Comprehensive explanation of the scheme's purpose, background, and target demographic..."
                    className="text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Source URL * (Gazette / Department Page)
                    </label>
                    <Input
                      type="url"
                      value={officialSourceUrl}
                      onChange={(e) => setOfficialSourceUrl(e.target.value)}
                      placeholder="https://department.gov.in/scheme"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Application Portal URL
                    </label>
                    <Input
                      type="url"
                      value={officialApplicationUrl}
                      onChange={(e) => setOfficialApplicationUrl(e.target.value)}
                      placeholder="https://edistrict.gov.in"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Application Method
                    </label>
                    <Select
                      value={applicationMethod}
                      onChange={(e) => setApplicationMethod(e.target.value as ApplicationMethod)}
                      className="text-xs"
                    >
                      <option value="ONLINE">Online Portal</option>
                      <option value="OFFLINE">Offline Form</option>
                      <option value="ONLINE_AND_OFFLINE">Online &amp; Offline</option>
                      <option value="THROUGH_INSTITUTION">Through Educational Institution</option>
                      <option value="THROUGH_DEPARTMENT">Through Department Office</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Government Reference / Order Number
                    </label>
                    <Input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. G.O. Ms. No. 128 / 2026"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Application Steps &amp; Citizen Instructions
                  </label>
                  <Textarea
                    rows={4}
                    value={applicationInstructions}
                    onChange={(e) => setApplicationInstructions(e.target.value)}
                    placeholder="Step-by-step guidance on registration, document verification, and submission..."
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: BENEFITS */}
            {activeTab === 'benefits' && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Benefit Provisions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setBenefits((prev) => [
                        ...prev,
                        {
                          benefitType: 'SCHOLARSHIP',
                          amount: 10000,
                          frequency: 'ANNUAL',
                          description: 'Allowance',
                        },
                      ])
                    }
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Benefit
                  </Button>
                </div>

                {benefits.map((benefit, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">Benefit #{idx + 1}</span>
                      {benefits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBenefits((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Benefit Type
                        </label>
                        <Select
                          value={benefit.benefitType}
                          onChange={(e) => {
                            const val = e.target.value as BenefitType;
                            setBenefits((prev) =>
                              prev.map((b, i) => (i === idx ? { ...b, benefitType: val } : b)),
                            );
                          }}
                          className="text-xs"
                        >
                          <option value="SCHOLARSHIP">Scholarship</option>
                          <option value="SUBSIDY">Subsidy</option>
                          <option value="LOAN">Loan</option>
                          <option value="INSURANCE">Insurance</option>
                          <option value="PENSION">Pension</option>
                          <option value="FEE_REIMBURSEMENT">Fee Reimbursement</option>
                          <option value="EQUIPMENT">Equipment / Asset</option>
                          <option value="FINANCIAL_ASSISTANCE">Financial Assistance</option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Amount (INR)
                        </label>
                        <Input
                          type="number"
                          value={benefit.amount || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setBenefits((prev) =>
                              prev.map((b, i) => (i === idx ? { ...b, amount: val } : b)),
                            );
                          }}
                          placeholder="e.g. 25000"
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Frequency
                        </label>
                        <Select
                          value={benefit.frequency}
                          onChange={(e) => {
                            const val = e.target.value as BenefitFrequency;
                            setBenefits((prev) =>
                              prev.map((b, i) => (i === idx ? { ...b, frequency: val } : b)),
                            );
                          }}
                          className="text-xs"
                        >
                          <option value="ANNUAL">Annual</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="ONE_TIME">One Time</option>
                          <option value="PER_SEMESTER">Per Semester</option>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Benefit Description
                      </label>
                      <Input
                        value={benefit.description || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBenefits((prev) =>
                            prev.map((b, i) => (i === idx ? { ...b, description: val } : b)),
                          );
                        }}
                        placeholder="e.g. Tuition fee exemption and hostel maintenance"
                        className="text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: APPLICATION CYCLES */}
            {activeTab === 'periods' && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Application Cycles &amp; Deadlines</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setApplicationPeriods((prev) => [
                        ...prev,
                        {
                          title: 'Upcoming Cycle',
                          status: 'UPCOMING',
                        },
                      ])
                    }
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Cycle
                  </Button>
                </div>

                {applicationPeriods.map((period, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">Cycle #{idx + 1}</span>
                      {applicationPeriods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setApplicationPeriods((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Cycle Title *
                        </label>
                        <Input
                          value={period.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setApplicationPeriods((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, title: val } : p)),
                            );
                          }}
                          placeholder="e.g. AY 2026-27 Application Cycle"
                          className="text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Academic Year
                        </label>
                        <Input
                          value={period.academicYear || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setApplicationPeriods((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, academicYear: val } : p)),
                            );
                          }}
                          placeholder="e.g. 2026-2027"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Opening Date
                        </label>
                        <Input
                          type="date"
                          value={period.applicationOpenDate ? String(period.applicationOpenDate).slice(0, 10) : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setApplicationPeriods((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, applicationOpenDate: val } : p)),
                            );
                          }}
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Closing Date
                        </label>
                        <Input
                          type="date"
                          value={period.applicationCloseDate ? String(period.applicationCloseDate).slice(0, 10) : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setApplicationPeriods((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, applicationCloseDate: val } : p)),
                            );
                          }}
                          className="text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Status
                        </label>
                        <Select
                          value={period.status}
                          onChange={(e) => {
                            const val = e.target.value as 'OPEN' | 'CLOSED' | 'UPCOMING';
                            setApplicationPeriods((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, status: val } : p)),
                            );
                          }}
                          className="text-xs"
                        >
                          <option value="OPEN">Open</option>
                          <option value="UPCOMING">Upcoming</option>
                          <option value="CLOSED">Closed</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: REQUIRED DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Required Document Checklist</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDocuments((prev) => [
                        ...prev,
                        {
                          documentType: 'MARKSHEET',
                          name: 'Previous Year Marksheet',
                          mandatory: true,
                        },
                      ])
                    }
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Document
                  </Button>
                </div>

                {documents.map((doc, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">Document #{idx + 1}</span>
                      {documents.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDocuments((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Document Type
                        </label>
                        <Select
                          value={doc.documentType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDocuments((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, documentType: val } : d)),
                            );
                          }}
                          className="text-xs"
                        >
                          <option value="INCOME_CERTIFICATE">Income Certificate</option>
                          <option value="COMMUNITY_CERTIFICATE">Community / Caste Certificate</option>
                          <option value="MARKSHEET">Marksheet</option>
                          <option value="BONAFIDE_CERTIFICATE">Bonafide Certificate</option>
                          <option value="DOMICILE_CERTIFICATE">Domicile / Residence Certificate</option>
                          <option value="DISABILITY_CERTIFICATE">Disability Certificate</option>
                          <option value="BANK_PASSBOOK">Bank Passbook</option>
                          <option value="AADHAAR_CARD">Aadhaar Card</option>
                          <option value="OTHER">Other Prescribed Document</option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Document Name *
                        </label>
                        <Input
                          value={doc.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDocuments((prev) =>
                              prev.map((d, i) => (i === idx ? { ...d, name: val } : d)),
                            );
                          }}
                          placeholder="e.g. Income Certificate from Tahsildar"
                          className="text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Issuing Authority &amp; Instructions
                      </label>
                      <Input
                        value={doc.description || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDocuments((prev) =>
                            prev.map((d, i) => (i === idx ? { ...d, description: val } : d)),
                          );
                        }}
                        placeholder="e.g. Revenue Department or e-Sevai Center"
                        className="text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 6: ELIGIBILITY RULE BUILDER */}
            {activeTab === 'rules' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Structured Eligibility Rule Builder
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Define machine-readable conditions from the controlled profile catalog. Module 4 will evaluate these rules deterministically.
                  </p>
                </div>

                {/* Add Rule Form */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                  <div className="text-xs font-bold text-gov-900">Add New Eligibility Condition</div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Profile Attribute
                      </label>
                      <Select
                        value={selectedField}
                        onChange={(e) => {
                          const f = e.target.value;
                          setSelectedField(f);
                          const entry = RULE_FIELD_CATALOG[f];
                          const firstOp = entry?.allowedOperators[0];
                          if (firstOp) {
                            setSelectedOperator(firstOp);
                          }
                        }}
                        className="text-xs"
                      >
                        {Object.values(RULE_FIELD_CATALOG).map((f) => (
                          <option key={f.field} value={f.field}>
                            {f.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Operator
                      </label>
                      <Select
                        value={selectedOperator}
                        onChange={(e) => setSelectedOperator(e.target.value as RuleOperator)}
                        className="text-xs"
                      >
                        {RULE_FIELD_CATALOG[selectedField]?.allowedOperators.map((op) => (
                          <option key={op} value={op}>
                            {op.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Condition Value
                      </label>
                      <Input
                        value={ruleValue}
                        onChange={(e) => setRuleValue(e.target.value)}
                        placeholder="e.g. 250000 or Tamil Nadu"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Human-Readable Explanation (Shown to Citizens)
                    </label>
                    <Input
                      value={ruleDescription}
                      onChange={(e) => setRuleDescription(e.target.value)}
                      placeholder="e.g. Annual family income must not exceed ₹2.5 lakh."
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ruleMandatory}
                        onChange={(e) => setRuleMandatory(e.target.checked)}
                        className="rounded border-slate-300 text-gov-800"
                      />
                      <span>Mandatory Requirement (Non-negotiable)</span>
                    </label>

                    <Button type="button" variant="primary" size="sm" onClick={handleAddRule} className="text-xs font-bold">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Condition
                    </Button>
                  </div>
                </div>

                {/* Live Rule Preview */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Configured Rule Set ({rules.length} conditions)
                    </span>
                  </div>

                  {rules.length === 0 ? (
                    <div className="p-4 rounded border border-dashed border-slate-300 text-center text-xs text-slate-400">
                      No eligibility conditions added yet. Open schemes with no conditions apply to all citizens.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3 text-xs shadow-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">
                                {rule.description}
                              </span>
                              {rule.mandatory && (
                                <Badge variant="danger" className="text-[10px]">
                                  Mandatory
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {rule.field} &bull; {rule.operator} &bull; Value: {String(rule.value)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeRule(idx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Remove condition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
              <Link to="/admin/schemes">
                <Button variant="secondary" type="button" className="text-xs">
                  Cancel
                </Button>
              </Link>

              <Button
                type="submit"
                variant="primary"
                isLoading={createMutation.isPending || updateMutation.isPending}
                className="text-xs font-bold shadow-sm"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {isEditMode ? 'Update Scheme & Snapshot' : 'Save Scheme Draft'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
};
