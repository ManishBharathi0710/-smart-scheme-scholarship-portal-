/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function validateDataIntegrity(): Promise<{
  passed: boolean;
  checks: Record<string, { status: 'PASS' | 'FAIL'; count: number; details?: string }>;
}> {
  console.log('🔍 Executing Relational Data Integrity Audit...');

  const checks: Record<string, { status: 'PASS' | 'FAIL'; count: number; details?: string }> = {};

  // 1. Total counts
  const [totalUsers, totalSchemes, totalRecs, totalDocs, totalNotifs, totalAuditLogs] =
    await Promise.all([
      prisma.user.count(),
      prisma.scheme.count(),
      prisma.recommendation.count(),
      prisma.userDocument.count(),
      prisma.notification.count(),
      prisma.auditLog.count(),
    ]);

  console.log(`   - Users: ${totalUsers}`);
  console.log(`   - Schemes: ${totalSchemes}`);
  console.log(`   - Recommendations: ${totalRecs}`);
  console.log(`   - Documents: ${totalDocs}`);
  console.log(`   - Notifications: ${totalNotifs}`);
  console.log(`   - Audit Records: ${totalAuditLogs}`);

  // 2. Fetch primary key sets for foreign-key verification
  const [userList, schemeList, departmentList] = await Promise.all([
    prisma.user.findMany({ select: { id: true } }),
    prisma.scheme.findMany({ select: { id: true } }),
    prisma.department.findMany({ select: { id: true } }),
  ]);

  const userIds = new Set(userList.map((u) => u.id));
  const schemeIds = new Set(schemeList.map((s) => s.id));
  const departmentIds = new Set(departmentList.map((d) => d.id));

  // 3. Check for orphaned recommendations
  const allRecs = await prisma.recommendation.findMany({
    select: { id: true, userId: true },
  });
  const orphanedRecs = allRecs.filter((r) => !userIds.has(r.userId));
  checks['recommendations_valid_user'] = {
    status: orphanedRecs.length === 0 ? 'PASS' : 'FAIL',
    count: orphanedRecs.length,
    details: orphanedRecs.length
      ? `${orphanedRecs.length} orphaned recommendations found`
      : undefined,
  };

  // 4. Check for orphaned saved schemes
  const allSaved = await prisma.savedScheme.findMany({
    select: { id: true, userId: true, schemeId: true },
  });
  const orphanedSaved = allSaved.filter(
    (s) => !userIds.has(s.userId) || !schemeIds.has(s.schemeId),
  );
  checks['saved_schemes_valid_relations'] = {
    status: orphanedSaved.length === 0 ? 'PASS' : 'FAIL',
    count: orphanedSaved.length,
  };

  // 5. Check for orphaned documents
  const allDocs = await prisma.userDocument.findMany({
    select: { id: true, userId: true },
  });
  const orphanedDocs = allDocs.filter((d) => !userIds.has(d.userId));
  checks['documents_valid_user'] = {
    status: orphanedDocs.length === 0 ? 'PASS' : 'FAIL',
    count: orphanedDocs.length,
  };

  // 6. Check for orphaned notifications
  const allNotifs = await prisma.notification.findMany({
    select: { id: true, userId: true },
  });
  const orphanedNotifs = allNotifs.filter((n) => !userIds.has(n.userId));
  checks['notifications_valid_user'] = {
    status: orphanedNotifs.length === 0 ? 'PASS' : 'FAIL',
    count: orphanedNotifs.length,
  };

  // 7. Schemes have valid departments
  const allSchemes = await prisma.scheme.findMany({
    select: { id: true, departmentId: true },
  });
  const orphanedSchemes = allSchemes.filter((s) => !departmentIds.has(s.departmentId));
  checks['schemes_valid_department'] = {
    status: orphanedSchemes.length === 0 ? 'PASS' : 'FAIL',
    count: orphanedSchemes.length,
  };

  const allPassed = Object.values(checks).every((c) => c.status === 'PASS');

  console.log('\n📊 Integrity Audit Summary:');
  for (const [name, result] of Object.entries(checks)) {
    const symbol = result.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${symbol} ${name}: ${result.status} (Anomalies: ${result.count})`);
  }

  if (allPassed) {
    console.log('\n✨ All relational integrity constraints verified successfully.');
  } else {
    console.warn('\n⚠️ Integrity anomalies detected. Review output above.');
  }

  return { passed: allPassed, checks };
}

// Direct execution
if (process.argv[1]?.includes('validate-data-integrity')) {
  validateDataIntegrity()
    .then((res) => {
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Integrity audit failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
