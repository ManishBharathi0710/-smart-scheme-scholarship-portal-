# Database Architecture, Models & Indexing

The platform uses PostgreSQL accessed via Prisma ORM.

---

## 1. Primary Data Models

- **Identity & Profiles**: `User`, `UserProfile`, `LocationProfile`, `EducationProfile`, `FinancialProfile`, `SocialEligibilityProfile`, `OccupationProfile`, `UserPreference`, `Consent`.
- **Schemes & Rules**: `Department`, `Scheme`, `Benefit`, `DocumentRequirement`, `ApplicationPeriod`, `EligibilityRule`, `SchemeVersion`.
- **Engagement & Vault**: `Recommendation`, `SavedScheme`, `RecentlyViewedScheme`, `UserDocument`, `DocumentExtraction`, `DocumentAuditLog`.
- **Notifications & AI**: `Notification`, `NotificationPreference`, `Conversation`, `ConversationMessage`, `AiUsage`.
- **Observability**: `AnalyticsEvent`, `AuditLog`, `SystemHealthCheck`.

---

## 2. Production Indexing Strategy

To maintain sub-100ms response times at scale, database indexes are strictly aligned with real-world query patterns:

| Table | Index Target | Query Pattern Optimized |
| :--- | :--- | :--- |
| `users` | `[email]`, `[role]`, `[status]`, `[created_at]` | Auth login, role guards, admin filtering |
| `schemes` | `[status]`, `[verificationStatus]`, `[programType]`, `[departmentId]`, `[stateScope]`, `[isPublished]` | Public scheme filtering, discovery search |
| `recommendations` | `[userId]`, `[schemeId]`, `[eligibilityStatus]` | Personalized matching computation |
| `saved_schemes` | `[userId, schemeId]` (unique), `[userId]` | Bookmark lookup, comparison listing |
| `user_documents` | `[userId]`, `[documentType]`, `[verificationStatus]` | Vault queries, document requirement checklist |
| `notifications` | `[userId]`, `[isRead]`, `[createdAt]` | Notification bell dropdown, unread count |
| `analytics_events`| `[eventType]`, `[category]`, `[timestamp]`, `[actorId]` | Administrative dashboards, conversion funnels |
| `audit_logs` | `[actorUserId]`, `[action]`, `[entityType]`, `[timestamp]` | Security investigation, compliance queries |

---

## 3. Database Maintenance & Backup Runbook

### Connection Pooling
Production uses connection pooling with limits tuned to container memory:
- `DATABASE_POOL_MIN`: `4`
- `DATABASE_POOL_MAX`: `20`
- `DATABASE_TIMEOUT_MS`: `10000` (10 seconds query timeout)

### Daily Automated Backups
```bash
./scripts/backup-db.sh
```
Executes a consistent `pg_dump` compressed with gzip (`.sql.gz`), timestamped and saved with a 30-day retention pruning policy.

### Safe Restoration
```bash
./scripts/restore-db.sh ./backups/database/smart_scheme_backup_YYYYMMDD_HHMMSS.sql.gz --confirm
```
Decompresses the snapshot, applies relational data, and automatically triggers `validate:integrity`.
