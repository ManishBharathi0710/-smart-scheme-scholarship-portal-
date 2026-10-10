# API Endpoint Catalog & Contract Specification

Base Route: `/api/v1`

---

## 1. System Health & Probes
- `GET /health` (Root probe) — Container process liveness
- `GET /ready` (Root probe) — Container service readiness
- `GET /api/v1/health` — Comprehensive system health
- `GET /api/v1/health/live` — Liveness check
- `GET /api/v1/health/ready` — Readiness check
- `GET /api/v1/admin/system-health` — Detailed subsystem diagnostics (Database, Storage, OCR, AI, Notifications)

---

## 2. Authentication & Authorization (Module 1 & 2)
- `POST /api/v1/auth/register` — Citizen registration
- `POST /api/v1/auth/login` — Authentication & token pair issuance
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Revoke active refresh token
- `POST /api/v1/auth/forgot-password` — Password reset request
- `POST /api/v1/auth/reset-password` — Set new password with token

---

## 3. User Profile & Entitlement Attributes (Module 2)
- `GET /api/v1/profile` — Get full citizen profile
- `PUT /api/v1/profile` — Update primary profile
- `PUT /api/v1/profile/location` — Update geographic attributes
- `PUT /api/v1/profile/education` — Update educational history
- `PUT /api/v1/profile/financial` — Update financial bracket
- `PUT /api/v1/profile/social` — Update social category & criteria
- `PUT /api/v1/profile/occupation` — Update occupational status
- `GET /api/v1/consents` — List active user consents
- `POST /api/v1/consents` — Grant explicit data consent

---

## 4. Scheme & Scholarship Management (Module 3)
- `GET /api/v1/schemes` — Public scheme catalog search & filter
- `GET /api/v1/schemes/:idOrSlug` — Detailed scheme information
- `GET /api/v1/departments` — List verified government departments
- `GET /api/v1/admin/schemes` — Admin list schemes
- `POST /api/v1/admin/schemes` — Create new scheme
- `PUT /api/v1/admin/schemes/:id` — Update existing scheme
- `PATCH /api/v1/admin/schemes/:id/verify` — Review & verify scheme authenticity

---

## 5. Rule-Based Recommendations (Module 4)
- `GET /api/v1/recommendations` — Compute deterministic personalized matches
- `GET /api/v1/recommendations/:id` — Inspect match breakdown & rule criteria

---

## 6. Citizen Dashboard & Saved Schemes (Module 5)
- `GET /api/v1/dashboard` — Aggregated dashboard with metrics and updates
- `GET /api/v1/saved-schemes` — List bookmarked schemes
- `POST /api/v1/saved-schemes` — Save scheme
- `DELETE /api/v1/saved-schemes/:schemeId` — Remove saved scheme
- `POST /api/v1/schemes/compare` — Compare multiple schemes side-by-side

---

## 7. Document Vault & Verification Readiness (Module 6)
- `POST /api/v1/documents/upload` — Secure document upload
- `GET /api/v1/documents` — User document library
- `GET /api/v1/documents/:id` — Single document metadata & extraction
- `POST /api/v1/documents/:id/ocr` — Trigger automated OCR extraction
- `POST /api/v1/documents/:id/confirm-fields` — Review & confirm extracted data with user consent
- `GET /api/v1/documents/:id/download-token` — Generate short-lived signed download token
- `GET /api/v1/documents/download/:token` — Download file via signed token

---

## 8. Notifications & Alerts (Module 7)
- `GET /api/v1/notifications` — List in-app notifications
- `GET /api/v1/notifications/unread-count` — Count unread alerts
- `PATCH /api/v1/notifications/:id/read` — Mark notification read
- `PATCH /api/v1/notifications/read-all` — Mark all read
- `GET /api/v1/notification-preferences` — Get notification channels & thresholds
- `PUT /api/v1/notification-preferences` — Update alert preferences

---

## 9. AI Assistant & Grounded Guidance (Module 8)
- `POST /api/v1/assistant/chat` — Send grounded message with strict zero-hallucination verification
- `GET /api/v1/assistant/conversations` — User conversation history
- `GET /api/v1/assistant/conversations/:id` — Retrieve conversation thread
- `DELETE /api/v1/assistant/conversations/:id` — Delete conversation thread

---

## 10. Analytics, Audit & Administrative Intelligence (Module 9)
- `POST /api/v1/admin/analytics/events` — Non-blocking event telemetry ingestion
- `GET /api/v1/admin/analytics/overview` — Platform KPI summary
- `GET /api/v1/admin/analytics/users` — User demographics & profile completion buckets
- `GET /api/v1/admin/analytics/schemes` — Scheme discovery funnel conversion
- `GET /api/v1/admin/analytics/recommendations` — Eligibility distribution & failure criteria
- `GET /api/v1/admin/analytics/documents` — OCR success & confidence metrics
- `GET /api/v1/admin/analytics/notifications` — Dispatch volume & read rate
- `GET /api/v1/admin/analytics/ai` — Token usage, latency, and intent distribution
- `GET /api/v1/admin/analytics/search` — Search term volume & zero-result queries
- `POST /api/v1/admin/analytics/export` — Audited CSV / JSON data export
- `GET /api/v1/admin/audit-logs` — Search immutable security audit trail
- `GET /api/v1/admin/audit-logs/:id` — Single audit log record
