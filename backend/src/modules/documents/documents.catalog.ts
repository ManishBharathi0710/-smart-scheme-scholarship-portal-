import { DocumentCategory } from '@prisma/client';

export interface DocumentTypeDefinition {
  type: string;
  label: string;
  category: DocumentCategory;
  allowedMimeTypes: string[];
  maxSizeMb?: number;
  supportsOCR: boolean;
  extractableFields?: Array<{
    field: string;
    label: string;
    description: string;
    dataType: 'STRING' | 'NUMBER' | 'DATE';
  }>;
  profileMapping?: Record<string, string>;
  defaultExpiryMonths?: number | null;
}

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpeg', '.jpg', '.png'];

export const DOCUMENT_CATALOG: Record<string, DocumentTypeDefinition> = {
  INCOME_CERTIFICATE: {
    type: 'INCOME_CERTIFICATE',
    label: 'Annual Income Certificate',
    category: DocumentCategory.INCOME,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: true,
    defaultExpiryMonths: 12, // Typically valid for 1 financial year
    extractableFields: [
      {
        field: 'name',
        label: 'Full Name',
        description: 'Name of candidate or household head',
        dataType: 'STRING',
      },
      {
        field: 'annualIncome',
        label: 'Annual Household Income (₹)',
        description: 'Declared annual family income',
        dataType: 'NUMBER',
      },
      {
        field: 'financialYear',
        label: 'Financial Year',
        description: 'Applicable financial assessment year',
        dataType: 'STRING',
      },
      {
        field: 'certificateNumber',
        label: 'Certificate / Application Number',
        description: 'Statutory certificate serial number',
        dataType: 'STRING',
      },
      {
        field: 'issueDate',
        label: 'Date of Issue',
        description: 'Date certificate was stamped/issued',
        dataType: 'DATE',
      },
      {
        field: 'issuingAuthority',
        label: 'Issuing Authority',
        description: 'Revenue Tahsildar or designated officer',
        dataType: 'STRING',
      },
    ],
    profileMapping: {
      annualIncome: 'annualIncome',
    },
  },
  COMMUNITY_CERTIFICATE: {
    type: 'COMMUNITY_CERTIFICATE',
    label: 'Community / Caste Certificate',
    category: DocumentCategory.COMMUNITY,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: true,
    defaultExpiryMonths: null, // Lifetime validity in most states
    extractableFields: [
      {
        field: 'name',
        label: 'Candidate Name',
        description: 'Full name on certificate',
        dataType: 'STRING',
      },
      {
        field: 'community',
        label: 'Community / Sub-Caste',
        description: 'Specific community denomination',
        dataType: 'STRING',
      },
      {
        field: 'category',
        label: 'Social Category',
        description: 'SC, ST, OBC, BC, MBC, General',
        dataType: 'STRING',
      },
      {
        field: 'certificateNumber',
        label: 'Certificate Number',
        description: 'Statutory serial number',
        dataType: 'STRING',
      },
      { field: 'issueDate', label: 'Date of Issue', description: 'Date issued', dataType: 'DATE' },
      {
        field: 'issuingAuthority',
        label: 'Issuing Authority',
        description: 'Zonal Deputy Tahsildar / Sub-Collector',
        dataType: 'STRING',
      },
    ],
    profileMapping: {
      category: 'socialCategory',
    },
  },
  MARKSHEET: {
    type: 'MARKSHEET',
    label: 'Academic Marksheet / Transcript',
    category: DocumentCategory.EDUCATION,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: true,
    defaultExpiryMonths: null,
    extractableFields: [
      {
        field: 'name',
        label: 'Student Name',
        description: 'Full name on marksheet',
        dataType: 'STRING',
      },
      {
        field: 'institution',
        label: 'School / College / University',
        description: 'Issuing educational institution',
        dataType: 'STRING',
      },
      {
        field: 'course',
        label: 'Examination / Course',
        description: '10th, 12th, B.Tech, B.Sc, etc.',
        dataType: 'STRING',
      },
      {
        field: 'academicYear',
        label: 'Year of Examination',
        description: 'Passing month and year',
        dataType: 'STRING',
      },
      {
        field: 'percentage',
        label: 'Percentage (%)',
        description: 'Aggregate percentage scored',
        dataType: 'NUMBER',
      },
      {
        field: 'marks',
        label: 'Total Marks Scored',
        description: 'Aggregate numerical score',
        dataType: 'STRING',
      },
      {
        field: 'rollNumber',
        label: 'Registration / Roll Number',
        description: 'Candidate registration code',
        dataType: 'STRING',
      },
    ],
    profileMapping: {
      percentage: 'academicPercentage',
    },
  },
  AADHAAR: {
    type: 'AADHAAR',
    label: 'Aadhaar Card / UIDAI Letter',
    category: DocumentCategory.IDENTITY,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: true,
    defaultExpiryMonths: null,
    extractableFields: [
      {
        field: 'name',
        label: 'Full Name',
        description: 'Name as printed on Aadhaar',
        dataType: 'STRING',
      },
      {
        field: 'dateOfBirth',
        label: 'Date of Birth',
        description: 'DD/MM/YYYY birth date',
        dataType: 'DATE',
      },
      {
        field: 'gender',
        label: 'Gender',
        description: 'MALE, FEMALE, TRANSGENDER',
        dataType: 'STRING',
      },
      {
        field: 'documentNumber',
        label: 'Aadhaar Number',
        description: '12-digit unique identity number',
        dataType: 'STRING',
      },
    ],
    profileMapping: {
      name: 'fullName',
      dateOfBirth: 'dateOfBirth',
      gender: 'gender',
    },
  },
  PAN: {
    type: 'PAN',
    label: 'Permanent Account Number (PAN) Card',
    category: DocumentCategory.IDENTITY,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: true,
    defaultExpiryMonths: null,
    extractableFields: [
      {
        field: 'name',
        label: 'Full Name',
        description: 'Name printed on PAN card',
        dataType: 'STRING',
      },
      {
        field: 'dateOfBirth',
        label: 'Date of Birth',
        description: 'Birth date on card',
        dataType: 'DATE',
      },
      {
        field: 'documentNumber',
        label: 'PAN Number',
        description: '10-character alphanumeric PAN',
        dataType: 'STRING',
      },
    ],
  },
  DISABILITY_CERTIFICATE: {
    type: 'DISABILITY_CERTIFICATE',
    label: 'Unique Disability ID (UDID) / Medical Certificate',
    category: DocumentCategory.DISABILITY,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: true,
    defaultExpiryMonths: null,
    extractableFields: [
      {
        field: 'name',
        label: 'Beneficiary Name',
        description: 'Name of person with disability',
        dataType: 'STRING',
      },
      {
        field: 'disabilityType',
        label: 'Type of Disability',
        description: 'Locomotor, Visual, Hearing, etc.',
        dataType: 'STRING',
      },
      {
        field: 'disabilityPercentage',
        label: 'Disability Percentage (%)',
        description: 'Medical board certified percentage',
        dataType: 'NUMBER',
      },
      {
        field: 'certificateNumber',
        label: 'UDID / Certificate Number',
        description: 'Official registration identifier',
        dataType: 'STRING',
      },
      {
        field: 'issueDate',
        label: 'Date of Issue',
        description: 'Medical board examination date',
        dataType: 'DATE',
      },
      {
        field: 'issuingAuthority',
        label: 'Medical Board / District Hospital',
        description: 'Certifying medical authority',
        dataType: 'STRING',
      },
    ],
    profileMapping: {
      disabilityType: 'disabilityType',
      disabilityPercentage: 'disabilityPercentage',
    },
  },
  BANK_PASSBOOK: {
    type: 'BANK_PASSBOOK',
    label: 'Bank Passbook Front Page / Statement',
    category: DocumentCategory.BANK,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: true,
    defaultExpiryMonths: null,
    extractableFields: [
      {
        field: 'accountHolderName',
        label: 'Account Holder Name',
        description: 'Primary name registered with bank',
        dataType: 'STRING',
      },
      {
        field: 'accountNumber',
        label: 'Account Number',
        description: 'Savings bank account number',
        dataType: 'STRING',
      },
      {
        field: 'bankName',
        label: 'Bank Name',
        description: 'Financial institution name',
        dataType: 'STRING',
      },
      {
        field: 'ifscCode',
        label: 'IFSC Code',
        description: '11-character bank branch code',
        dataType: 'STRING',
      },
      {
        field: 'branch',
        label: 'Branch Name',
        description: 'Local branch location',
        dataType: 'STRING',
      },
    ],
  },
  RESIDENCE_CERTIFICATE: {
    type: 'RESIDENCE_CERTIFICATE',
    label: 'Nativity / Residence / Domicile Certificate',
    category: DocumentCategory.RESIDENCE,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: true,
    defaultExpiryMonths: 60, // 5 years in many states
    extractableFields: [
      {
        field: 'name',
        label: 'Resident Name',
        description: 'Name of resident citizen',
        dataType: 'STRING',
      },
      {
        field: 'state',
        label: 'State / Union Territory',
        description: 'Domicile state',
        dataType: 'STRING',
      },
      { field: 'district', label: 'District', description: 'Revenue district', dataType: 'STRING' },
      {
        field: 'certificateNumber',
        label: 'Certificate Number',
        description: 'Registration serial',
        dataType: 'STRING',
      },
      { field: 'issueDate', label: 'Date of Issue', description: 'Date stamped', dataType: 'DATE' },
    ],
    profileMapping: {
      state: 'state',
      district: 'district',
    },
  },
  BONAFIDE_CERTIFICATE: {
    type: 'BONAFIDE_CERTIFICATE',
    label: 'Institution Bonafide Certificate',
    category: DocumentCategory.EDUCATION,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: true,
    defaultExpiryMonths: 12,
    extractableFields: [
      {
        field: 'name',
        label: 'Student Name',
        description: 'Full student name',
        dataType: 'STRING',
      },
      {
        field: 'institution',
        label: 'School / College Name',
        description: 'Enrolled institution',
        dataType: 'STRING',
      },
      {
        field: 'course',
        label: 'Course / Class',
        description: 'Current degree or standard',
        dataType: 'STRING',
      },
      {
        field: 'academicYear',
        label: 'Academic Year',
        description: 'Current academic cycle',
        dataType: 'STRING',
      },
    ],
  },
  RATION_CARD: {
    type: 'RATION_CARD',
    label: 'Smart Ration Card / Food Security Card',
    category: DocumentCategory.IDENTITY,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: true,
    defaultExpiryMonths: null,
    extractableFields: [
      {
        field: 'cardHolderName',
        label: 'Head of Family',
        description: 'Card holder name',
        dataType: 'STRING',
      },
      {
        field: 'cardNumber',
        label: 'Ration Card Number',
        description: 'Card identifier',
        dataType: 'STRING',
      },
      {
        field: 'familyMembersCount',
        label: 'Family Members Count',
        description: 'Total units registered',
        dataType: 'NUMBER',
      },
    ],
  },
  OTHER: {
    type: 'OTHER',
    label: 'Other Statutory Document',
    category: DocumentCategory.OTHER,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    supportsOCR: false,
    defaultExpiryMonths: null,
  },
};

export function isDocumentTypeValid(type: string): boolean {
  return Boolean(DOCUMENT_CATALOG[type]);
}

export function getDocumentTypeDefinition(type: string): DocumentTypeDefinition {
  return (
    DOCUMENT_CATALOG[type] || {
      type,
      label: type.replace(/_/g, ' '),
      category: DocumentCategory.OTHER,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      supportsOCR: false,
    }
  );
}

export function getDocumentCategoryForType(type: string): DocumentCategory {
  const def = DOCUMENT_CATALOG[type];
  return def ? def.category : DocumentCategory.OTHER;
}

export function isAllowedMimeType(type: string, mimeType: string): boolean {
  const def = getDocumentTypeDefinition(type);
  return def.allowedMimeTypes.includes(mimeType);
}

export function isSupportedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}
