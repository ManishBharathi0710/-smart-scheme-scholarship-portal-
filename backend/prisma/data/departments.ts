import { DepartmentLevel } from '@prisma/client';

export interface DepartmentSeed {
  id: string;
  name: string;
  shortName: string;
  level: DepartmentLevel;
  state: string | null;
  officialWebsite: string;
  description: string;
}

export const DEPARTMENTS_DATA: DepartmentSeed[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Ministry of Minority Affairs',
    shortName: 'MMA',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://minorityaffairs.gov.in',
    description: 'Empowerment of minority communities through education and social welfare schemes.',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Ministry of Social Justice and Empowerment',
    shortName: 'MSJE',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://socialjustice.gov.in',
    description: 'Welfare and development programs for SC, OBC, EBC, and Persons with Disabilities.',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Department of Higher Education, Ministry of Education',
    shortName: 'DHE',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://www.education.gov.in',
    description: 'National scholarships, fellowships, and academic fee concessions.',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Ministry of Agriculture and Farmers Welfare',
    shortName: 'MoAFW',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://agricoop.nic.in',
    description: 'Farmer income support, crop insurance, and agricultural mechanization subsidies.',
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    name: 'Ministry of Skill Development and Entrepreneurship',
    shortName: 'MSDE',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://www.msde.gov.in',
    description: 'Vocational training, PMKVY certifications, and youth apprenticeship stipends.',
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    name: 'Ministry of Health and Family Welfare',
    shortName: 'MoHFW',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://mohfw.gov.in',
    description: 'Universal healthcare, Ayushman Bharat PM-JAY, maternal and child health programs.',
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    name: 'Ministry of Housing and Urban Affairs',
    shortName: 'MoHUA',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://mohua.gov.in',
    description: 'Affordable urban housing (PMAY-U), urban livelihoods, PM SVANidhi microcredit.',
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    name: 'Ministry of Rural Development',
    shortName: 'MoRD',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://rural.nic.in',
    description: 'Rural housing (PMAY-G), wage employment (MGNREGA), national social assistance (NSAP).',
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    name: 'Ministry of Women and Child Development',
    shortName: 'MoWCD',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://wcd.nic.in',
    description: 'Women empowerment, Beti Bachao, Poshan Abhiyaan, and maternity cash benefits.',
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    name: 'Department of Financial Services, Ministry of Finance',
    shortName: 'DFS-MoF',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://financialservices.gov.in',
    description: 'Pradhan Mantri MUDRA Yojana, social security insurance (PMJJBY, PMSBY), and Atal Pension.',
  },
  {
    id: '10000000-0000-0000-0000-000000000011',
    name: 'Ministry of Micro, Small and Medium Enterprises',
    shortName: 'MSME',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://msme.gov.in',
    description: 'PMEGP entrepreneurship, PM Vishwakarma craftsperson support, CGTMSE credit guarantees.',
  },
  {
    id: '10000000-0000-0000-0000-000000000012',
    name: 'Department of Empowerment of Persons with Disabilities',
    shortName: 'DEPwD',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://disabilityaffairs.gov.in',
    description: 'Assistive devices (ADIP), UDID cards, and inclusive education scholarships for Divyangjan.',
  },
  {
    id: '10000000-0000-0000-0000-000000000013',
    name: 'Ministry of Labour and Employment',
    shortName: 'MoLE',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://labour.gov.in',
    description: 'PM Shram Yogi Maan-dhan, e-Shram unorganized worker safety, and social welfare pensions.',
  },
  {
    id: '10000000-0000-0000-0000-000000000014',
    name: 'Ministry of Tribal Affairs',
    shortName: 'MoTA',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://tribal.nic.in',
    description: 'Educational advancement, Eklavya model residential schools, and tribal welfare grants.',
  },
  {
    id: '10000000-0000-0000-0000-000000000015',
    name: 'Ministry of New and Renewable Energy',
    shortName: 'MNRE',
    level: DepartmentLevel.CENTRAL,
    state: null,
    officialWebsite: 'https://mnre.gov.in',
    description: 'PM Surya Ghar rooftop solar subsidies, green energy assistance for households.',
  },
];
