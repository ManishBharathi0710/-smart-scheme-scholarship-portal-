import { prisma } from '../database/prisma.js';

async function fixSchemeVersions() {
  const schemes = await prisma.scheme.findMany({
    include: {
      versions: true,
      department: true,
      benefits: true,
      documents: true,
      applicationPeriods: true,
      eligibilityRules: true,
    },
  });

  console.log(`Found ${schemes.length} schemes.`);
  let createdCount = 0;

  for (const s of schemes) {
    if (s.versions.length === 0) {
      const { versions, ...snapshotData } = s;
      await prisma.schemeVersion.create({
        data: {
          schemeId: s.id,
          versionNumber: s.currentVersion || 1,
          changeSummary: 'Initial published version',
          snapshot: snapshotData as any,
          createdBy: s.createdBy,
        },
      });
      createdCount++;
    }
  }

  console.log(`Created ${createdCount} scheme versions.`);
  const totalVersions = await prisma.schemeVersion.count();
  console.log(`Total scheme versions in database now: ${totalVersions}`);
  await prisma.$disconnect();
}

fixSchemeVersions().catch(console.error);
