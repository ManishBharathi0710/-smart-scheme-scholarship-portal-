/* eslint-disable no-console */
import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import { ensureLocalDatabaseRunning } from './local-db.js';

async function fixSchemeVersions(): Promise<void> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      await ensureLocalDatabaseRunning();
    }

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
        const { versions: _versions, ...snapshotData } = s;
        await prisma.schemeVersion.upsert({
          where: {
            schemeId_versionNumber: {
              schemeId: s.id,
              versionNumber: s.currentVersion || 1,
            },
          },
          update: {},
          create: {
            schemeId: s.id,
            versionNumber: s.currentVersion || 1,
            changeSummary: 'Initial published version',
            snapshot: JSON.parse(JSON.stringify(snapshotData)) as Prisma.InputJsonValue,
            createdBy: s.createdBy,
          },
        });
        createdCount++;
      }
    }

    console.log(`Created ${createdCount} scheme versions.`);
    const totalVersions = await prisma.schemeVersion.count();
    console.log(`Total scheme versions in database now: ${totalVersions}`);
  } catch (error) {
    console.error('Error fixing scheme versions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixSchemeVersions().catch((err) => {
  console.error('Fatal execution error in fix-scheme-versions:', err);
  process.exit(1);
});