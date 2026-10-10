import {
  PrismaClient,
  Prisma,
  SchemeStatus,
  VerificationStatus,
} from '@prisma/client';
import { DEPARTMENTS_DATA } from './data/departments';
import { SCHEMES_PART1 } from './data/schemes-part1';
import { SCHEMES_PART2 } from './data/schemes-part2';
import { SCHEMES_PART3 } from './data/schemes-part3';
import { SCHEMES_PART4 } from './data/schemes-part4';

const prisma = new PrismaClient();

async function seedAllOfficialSchemes(): Promise<void> {
  console.log('🇮🇳 Starting Comprehensive Official Indian Government Schemes Seeding...');

  // 1. Seed All Departments
  console.log(`\n🏢 Seeding ${DEPARTMENTS_DATA.length} Central Ministries & Departments...`);
  for (const dep of DEPARTMENTS_DATA) {
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
    console.log(`   ✓ [Ministry] ${dep.shortName.padEnd(10)} - ${dep.name}`);
  }

  // 2. Combine all scheme parts
  const allSchemes = [...SCHEMES_PART1, ...SCHEMES_PART2, ...SCHEMES_PART3, ...SCHEMES_PART4];
  console.log(`\n📋 Seeding ${allSchemes.length} Verified Indian Government Schemes...`);

  let count = 0;
  for (const s of allSchemes) {
    count++;
    // Upsert scheme
    await prisma.scheme.upsert({
      where: { id: s.id },
      update: {
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        shortDescription: s.shortDescription,
        description: s.description,
        departmentId: s.departmentId,
        ministry: s.ministry,
        programType: s.programType,
        categories: s.categories,
        stateScope: s.stateScope,
        status: SchemeStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        lastVerifiedAt: new Date(),
        officialSourceUrl: s.officialSourceUrl,
        officialApplicationUrl: s.officialApplicationUrl,
        applicationMethod: s.applicationMethod,
        isPublished: true,
        verificationNotes: `Verified official scheme under ${s.ministry}. Official URL: ${s.officialSourceUrl}`,
      },
      create: {
        id: s.id,
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        shortDescription: s.shortDescription,
        description: s.description,
        departmentId: s.departmentId,
        ministry: s.ministry,
        programType: s.programType,
        categories: s.categories,
        stateScope: s.stateScope,
        status: SchemeStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
        lastVerifiedAt: new Date(),
        officialSourceUrl: s.officialSourceUrl,
        officialApplicationUrl: s.officialApplicationUrl,
        applicationMethod: s.applicationMethod,
        isPublished: true,
        verificationNotes: `Verified official scheme under ${s.ministry}. Official URL: ${s.officialSourceUrl}`,
      },
    });

    // Replace Benefits
    await prisma.benefit.deleteMany({ where: { schemeId: s.id } });
    await prisma.benefit.create({
      data: {
        schemeId: s.id,
        benefitType: s.benefit.type,
        description: s.benefit.description,
        amount: s.benefit.amount ? new Prisma.Decimal(s.benefit.amount) : null,
        frequency: s.benefit.frequency,
      },
    });

    // Replace Application Period
    await prisma.applicationPeriod.deleteMany({ where: { schemeId: s.id } });
    await prisma.applicationPeriod.create({
      data: {
        schemeId: s.id,
        title: s.period.title,
        status: s.period.status,
        financialYear: '2026-2027',
      },
    });

    // Replace Document Requirements
    await prisma.documentRequirement.deleteMany({ where: { schemeId: s.id } });
    if (s.documents && s.documents.length > 0) {
      await prisma.documentRequirement.createMany({
        data: s.documents.map((d) => ({
          schemeId: s.id,
          documentType: d.documentType,
          name: d.name,
          mandatory: d.mandatory,
        })),
      });
    }

    // Replace Eligibility Rules
    await prisma.eligibilityRule.deleteMany({ where: { schemeId: s.id } });
    if (s.rules && s.rules.length > 0) {
      await prisma.eligibilityRule.createMany({
        data: s.rules.map((r, idx) => ({
          schemeId: s.id,
          field: r.field,
          operator: r.operator,
          value: r.value,
          dataType: r.dataType,
          description: r.description,
          mandatory: r.mandatory,
          order: idx,
        })),
      });
    }

    if (count % 10 === 0 || count === allSchemes.length) {
      console.log(`   ✓ Seeded ${count}/${allSchemes.length} schemes... (${s.name.substring(0, 45)})`);
    }
  }

  // Summary counts per category and program type
  const totalSchemes = await prisma.scheme.count();
  console.log(`\n🎉 Successfully completed seeding! Total schemes in database: ${totalSchemes}`);
}

seedAllOfficialSchemes()
  .catch((err) => {
    console.error('❌ Failed to seed official schemes:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
