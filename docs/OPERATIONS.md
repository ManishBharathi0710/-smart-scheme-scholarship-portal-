# Operations Runbook & Maintenance Protocols

## 1. Routine Operational Commands

| Action | Command | Frequency |
| :--- | :--- | :--- |
| **Database Backup** | `./scripts/backup-db.sh` | Daily (Cron) |
| **Storage Cleanup** | Clean orphaned temporary upload files | Weekly (Cron) |
| **Smoke Testing** | `./scripts/smoke-test.sh` | After each release |
| **Data Integrity Audit**| `npm --prefix backend run validate:integrity` | Monthly / Post-migration |
| **Prisma Generation** | `npm --prefix backend run prisma:generate` | Schema changes |

---

## 2. Health & Diagnostic Probes

- **Process Liveness**: `http://localhost:5001/health` (Used by Docker / K8s liveness probes).
- **Service Readiness**: `http://localhost:5001/ready` (Used by ingress / traffic balancers).
- **Subsystem Diagnostics**: `http://localhost:5001/api/v1/admin/system-health` (Authenticated endpoint verifying API, DB latency, storage R/W, OCR, AI, notifications).

---

## 3. Production Logging & Sanitization Policy

- **Structured JSON Logging**: Standardized via Pino HTTP logger with unique `x-request-id` correlation tags.
- **Strict Data Scrubbing**:
  - NEVER log: User passwords, plaintext JWT tokens, refresh tokens, Aadhaar numbers, bank account details, raw OCR base64 strings, or private citizen prompts.
  - Log levels: `warn` or `error` in production; `info` in staging; `debug` in development.

---

## 4. Secret Rotation Protocol

1. **JWT Secret Rotation**:
   - Update `JWT_SECRET` in environment variables / AWS Secrets Manager.
   - Execute zero-downtime rolling restart. Active refresh tokens remain valid and issue new access tokens seamlessly.
2. **Database Password Rotation**:
   - Create new database credentials in PostgreSQL.
   - Update `DATABASE_URL` in secrets manager.
   - Rolling restart backend service; verify with `./scripts/smoke-test.sh`.
