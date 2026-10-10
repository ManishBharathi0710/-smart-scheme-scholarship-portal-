# Disaster Recovery & Business Continuity Plan

## 1. Objectives & Metrics

- **Recovery Point Objective (RPO)**: **< 24 Hours** (Maximum acceptable data loss window via daily automated backups).
- **Recovery Time Objective (RTO)**: **< 2 Hours** (Target restoration time from outage identification to full service resumption).

---

## 2. Failure Scenarios & Graceful Degradation Protocols

### A. AI Model Provider Outage (Gemini / OpenAI down or throttled)
- **Impact**: AI Assistant chat unavailable.
- **Protocol**: Core platform degrades gracefully. Scheme discovery, rule-based recommendations, document management, and official application redirection remain 100% operational. Assistant returns clear advisory message without crashing client.

### B. OCR Processing Engine Failure
- **Impact**: Automatic field extraction temporarily pauses.
- **Protocol**: Document upload and storage vault remain fully operational. Citizens can manually review, enter, and confirm required fields.

### C. Email Channel Failure (SMTP provider unreachable)
- **Impact**: Outbound transactional email delivery fails.
- **Protocol**: Notification dispatcher logs failure and records in-app notification. Citizen continues to receive alerts via the In-App Notification Bell.

### D. Analytics / Clickstream Pipeline Failure
- **Impact**: Background telemetry event insertion fails.
- **Protocol**: Non-blocking asynchronous design ensures citizen workflows (saving schemes, opening links) complete with 200 OK without interruption.

### E. Primary Database Host Failure
- **Impact**: Full API degradation.
- **Protocol**:
  1. Automated alerting flags `/health` failure.
  2. Standby container / cloud instance provisioned.
  3. Execute `./scripts/restore-db.sh <latest_backup.sql.gz> --confirm`.
  4. Run `npm --prefix backend run validate:integrity`.
  5. Route traffic to recovered instance.
