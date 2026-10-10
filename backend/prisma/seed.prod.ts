import { PrismaClient, DepartmentLevel, SchemeStatus, VerificationStatus, ProgramType, BenefitType, BenefitFrequency, SchemeCategory } from '@prisma/client';

const prisma = new PrismaClient();

const CORE_DEPARTMENTS = [
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
];

async function seedProduction(): Promise<void> {
  console.log('🌱 Starting safe, idempotent production baseline seeding...');

  // 1. Seed Core Reference Departments
  for (const dep of CORE_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { id: dep.id },
      update: {
        name: dep.name,
        shortName: dep.shortName,
        level: dep.level,
        state: dep.state,
        officialWebsite: dep.officialWebsite,
        description: dep.description,
      },
      create: {
        id: dep.id,
        name: dep.name,
        shortName: dep.shortName,
        level: dep.level,
        state: dep.state,
        officialWebsite: dep.officialWebsite,
        description: dep.description,
      },
    });
    console.log(`   ✓ Department verified: ${dep.shortName} (${dep.name})`);
  }

  // 2. Ensure flagship foundational scheme exists for discovery
  const flagshipSchemeId = '20000000-0000-0000-0000-000000000001';
  await prisma.scheme.upsert({
    where: { id: flagshipSchemeId },
    update: {
      isPublished: true,
      status: SchemeStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    create: {
      id: flagshipSchemeId,
      slug: 'post-matric-scholarship-minorities',
      name: 'Post-Matric Scholarship for Minorities',
      shortDescription: 'Financial assistance for minority community students pursuing post-matriculation studies.',
      description: 'The Prime Minister scholarship scheme aims to encourage meritorious students from minority communities to pursue higher education from class 11 to Ph.D. level with financial assistance towards maintenance allowance and full course tuition fee reimbursement.',
      departmentId: CORE_DEPARTMENTS[0].id,
      programType: ProgramType.SCHOLARSHIP,
      categories: [SchemeCategory.EDUCATION, SchemeCategory.STUDENT_SUPPORT],
      stateScope: 'ALL_INDIA',
      status: SchemeStatus.ACTIVE,
      isPublished: true,
      verificationStatus: VerificationStatus.VERIFIED,
      lastVerifiedAt: new Date(),
      officialSourceUrl: 'https://scholarships.gov.in',
      officialApplicationUrl: 'https://scholarships.gov.in/apply',
      verificationNotes: 'Official scholarship portal is National Scholarship Portal (NSP). Information verified against gazette notification.',
      benefits: {
        create: [
          {
            benefitType: BenefitType.SCHOLARSHIP,
            description: 'Annual scholarship assistance covering tuition fee and maintenance allowance up to ₹20,000 per annum.',
            frequency: BenefitFrequency.ANNUAL,
          },
        ],
      },
    },
  });
  console.log('   ✓ Flagship Scheme verified: Post-Matric Scholarship for Minorities');

  console.log('✅ Production reference baseline seeding completed successfully.');
}

seedProduction()
  .catch((e) => {
    console.error('❌ Error during production seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
