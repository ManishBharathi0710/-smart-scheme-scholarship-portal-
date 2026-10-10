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

---

## Official Indian Government Schemes Dataset

The repository includes a comprehensive, verified seed catalog of **162 authentic Indian Government schemes** spanning all 15 Central Ministries and state welfare directorates:

### Seeding Commands
```bash
# Seed all 162 verified schemes across parts 1, 2, 3, and 4
npm --prefix backend run prisma:seed:all

# Production minimal baseline seed
npm --prefix backend run prisma:seed:prod
```

### Verified Category Coverage (Minimum 20 Official Schemes Per Category)
| Category Filter | Scheme Count | Sample Flagship Schemes Included |
| :--- | :---: | :--- |
| **Education** | **33** | Post-Matric SC/ST/OBC, PM-USP, AICTE Pragati, National Overseas Scholarship |
| **Social Security** | **45** | Atal Pension (APY), IGNOAPS, PM-SYM, Antyodaya Anna Yojana, NSAP |
| **Financial Assistance** | **40** | PM-KISAN, MUDRA Shishu/Kishore/Tarun, Stand-Up India, PM SVANidhi |
| **Health** | **26** | Ayushman Bharat (AB-PMJAY), Ayushman Vay Vandana 70+, Janani Suraksha, RAN |
| **Entrepreneurship** | **28** | PMEGP, Startup India Seed Fund (SISFS), CGTMSE, NBCFDC, Stand-Up India |
| **Women Empowerment** | **24** | Sukanya Samriddhi (SSY), Beti Bachao Beti Padhao, Mahila Samman, Mission Shakti |
| **Student Support** | **22** | NMMSS, PMRF, Ishan Uday, Pre/Post-Matric PwD Scholarships, CBSE Udaan |
| **Employment** | **21** | MGNREGA, PM Vishwakarma, National Apprenticeship (NAPS-2), ASEEM |
| **Agriculture & Farming** | **20** | PM-KISAN, PM Fasal Bima (PMFBY), Kisan Credit Card (KCC), PM-KUSUM |
| **Housing & Shelter** | **20** | PMAY-G, PMAY-U 2.0, PM Surya Ghar Solar, SBM-G IHHL, ARHCs, DDA, MHADA |
| **Persons with Disabilities** | **20** | ADIP Assistive Devices, Divyangjan Swavalamban, UDID Card, Niramaya Insurance |
| **Senior Citizens** | **20** | Ayushman 70+, PM Vaya Vandana, Senior Citizens Savings (SCSS), RVY, AVYAY |
| **Skill Development** | **20** | PMKVY 4.0, PM-DAKSH, DDU-GKY, CITS, STRIVE, SANKALP, Craftsmen Training |
| **Child Welfare** | **20** | PM CARES for Children, Poshan 2.0, Mission Vatsalya, KGBV, RBSK, Palna |

