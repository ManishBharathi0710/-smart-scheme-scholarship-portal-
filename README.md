# Smart Scheme & Scholarship Recommendation Portal

> **A trustworthy, explainable, and modular decision-support platform designed to help students and citizens discover verified government schemes, scholarships, welfare programs, subsidies, and educational benefits.**

[![Module 1: Complete](https://img.shields.io/badge/Module%201-Foundation%20%26%20Architecture-emerald.svg)](#)
[![Module 2: Complete](https://img.shields.io/badge/Module%202-Auth%20%26%20User%20Profile-emerald.svg)](#)
[![Module 3: Complete](https://img.shields.io/badge/Module%203-Scheme%20Management-emerald.svg)](#)
[![Module 4: Complete](https://img.shields.io/badge/Module%204-Recommendation%20Engine-emerald.svg)](#)
[![Module 5: Complete](https://img.shields.io/badge/Module%205-Discovery%20%26%20Dashboard-emerald.svg)](#)
[![Module 6: Complete](https://img.shields.io/badge/Module%206-Documents%20%26%20OCR-emerald.svg)](#)
[![Module 7: Complete](https://img.shields.io/badge/Module%207-Notifications%20%26%20Alerts-emerald.svg)](#)
[![Module 8: Complete](https://img.shields.io/badge/Module%208-AI%20Assistant%20%26%20Guidance-emerald.svg)](#)
[![Module 9: Complete](https://img.shields.io/badge/Module%209-Analytics%20%26%20Audit-emerald.svg)](#)
[![Module 10: Complete](https://img.shields.io/badge/Module%2010-Production%20%26%20Security-emerald.svg)](#)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-slate.svg)](#)

---

## 1. Problem Statement & Solution

Millions of deserving students and citizens miss out on crucial central and state government benefits, scholarships, and welfare programs due to fragmented data, confusing eligibility criteria, and lack of transparency.

This portal solves this through:
1. **Centralized Verified Catalog**: Official scheme data with direct application links and department verification.
2. **Deterministic Eligibility Engine**: Rules evaluated using structured logic (`AND/OR/NOT`), preventing opaque or arbitrary disqualification.
3. **Structured Citizen Facts**: Machine-readable profile attributes (education, income, category, location, occupation) decoupled from eligibility logic.
4. **Full Explainability**: Plain-language breakdowns of why a citizen is eligible, likely eligible, or needs certificate verification.
5. **Guarded AI Layer**: AI is used strictly for translation and document comprehension—never to hallucinate eligibility or invent deadlines.
6. **Privacy First**: Minimal data collection, strict consent requirements, enumeration-safe authentication, and secure document handling.
7. **Production Grade & Resilient**: Hardened against attacks (Helmet, CORS, rate limits), zero single points of failure (graceful degradation), automated backups, and non-root container deployment.

---

## 2. Technology Stack

### Frontend
* **Core**: React 18, TypeScript, Vite
* **Styling**: Tailwind CSS (Government Service / High Accessibility Theme)
* **Routing**: React Router v6 with `ProtectedRoute` guards and state preservation
* **Data Fetching & Caching**: TanStack Query v5
* **Form & Validation**: React Hook Form, Zod
* **HTTP Client**: Axios with centralized interceptors & Bearer token attachment
* **Icons**: Lucide React
* **Testing**: Vitest, React Testing Library, jsdom (20 test files, 64 tests)

### Backend
* **Runtime**: Node.js (v18+) with TypeScript
* **Server**: Express v4 modular monolith
* **Database & ORM**: PostgreSQL, Prisma ORM with connection pooling & exponential backoff retry
* **Authentication**: Short-lived JWT access tokens + SHA-256 hashed refresh tokens with rotation
* **Password Hashing**: Bcrypt (cost factor 12)
* **Logging**: Pino with structured JSON, requestId correlation, and sensitive data redaction
* **Validation**: Zod schema validation middleware (body, query, params)
* **Security**: Helmet, strict CORS, rate limiting (`authRateLimiter`, `apiRateLimiter`, `aiRateLimiter`), Request Correlation IDs
* **Testing**: Vitest, Supertest (16 test files, 146 tests)

---

## 3. Production Deployment & Quick Start

### Option A: Complete Docker Production Stack
Run frontend, backend, and PostgreSQL database with a single command:

```bash
# 1. Prepare environment
cp .env.production .env

# 2. Build and start containers in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# 3. Verify health probes
curl http://localhost:5001/health
curl http://localhost:5001/ready
```

* Frontend Application: `http://localhost`
* Backend API: `http://localhost:5001/api/v1`
* Root Health Check: `http://localhost:5001/health`

### Option B: Local Development
```bash
# 1. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Start PostgreSQL via Docker
docker compose up -d postgres

# 3. Database migrations & client generation
npm --prefix backend run prisma:migrate
npm --prefix backend run prisma:generate

# 4. Start Development Servers
npm run dev:backend   # Port 5001
npm run dev:frontend  # Port 5173
```

---

## 4. Verification & Testing

Both repositories feature comprehensive automated test suites:

```bash
# Run all automated tests (146 backend + 64 frontend = 210 tests passing)
npm test

# Run linters with strict zero-warnings policy
npm run lint

# Check formatting across all codebases
npm run format:check

# Run full production builds (backend tsc + frontend tsc & vite)
npm run build

# Run automated smoke test against active server
./scripts/smoke-test.sh
```

---

## 5. Ten-Module Completed Architecture

* [x] **MODULE 1**: Foundation & System Architecture *(Complete)*
* [x] **MODULE 2**: Authentication, Authorization & User Profile *(Complete)*
* [x] **MODULE 3**: Scheme & Scholarship Management *(Complete)*
* [x] **MODULE 4**: Rule-Based Recommendation Engine *(Complete)*
* [x] **MODULE 5**: Scheme Discovery, Search, Comparison & Personalized Dashboard *(Complete)*
* [x] **MODULE 6**: Document Management, Storage & OCR Verification Readiness *(Complete)*
* [x] **MODULE 7**: Notifications, Deadline Reminders & User Alerts *(Complete)*
* [x] **MODULE 8**: AI Assistant, Multilingual Guidance & Guarded Explanations *(Complete)*
* [x] **MODULE 9**: Administrative Analytics, Audit Trails & Monitoring *(Complete)*
* [x] **MODULE 10**: Production Deployment, Security Hardening, Reliability & Integration *(Complete)*

---

## 6. Production Documentation

Complete operational and architecture guides are available in the [`docs/`](file:///Users/manishbharathi/Desktop/Saturday%20project/docs) directory:

* [Architecture Guide](file:///Users/manishbharathi/Desktop/Saturday%20project/docs/ARCHITECTURE.md) — 10-module end-to-end data flow, module boundaries, and relational ERD.
* [Deployment Guide](file:///Users/manishbharathi/Desktop/Saturday%20project/docs/DEPLOYMENT.md) — Multi-stage Docker builds, Kubernetes/Cloud manifests, reverse proxy setup, and zero-downtime rolling deploys.
* [Security Manual](file:///Users/manishbharathi/Desktop/Saturday%20project/docs/SECURITY.md) — OWASP Top 10 mitigations, RBAC permissions matrix, rate limiting, and cryptographic standards.
* [Environment Reference](file:///Users/manishbharathi/Desktop/Saturday%20project/docs/ENVIRONMENT.md) — Comprehensive variable directory for development, staging, and production.
* [API Catalog](file:///Users/manishbharathi/Desktop/Saturday%20project/docs/API.md) — REST endpoint reference with request/response schemas and authentication requirements.
* [Database Guide](file:///Users/manishbharathi/Desktop/Saturday%20project/docs/DATABASE.md) — Connection pooling, indexing strategy, automated migrations, and seed management.
* [Disaster Recovery Plan](file:///Users/manishbharathi/Desktop/Saturday%20project/docs/DISASTER_RECOVERY.md) — RPO/RTO targets, backup verification, and graceful degradation protocols.
* [Operations Runbook](file:///Users/manishbharathi/Desktop/Saturday%20project/docs/OPERATIONS.md) — Health checks, alert thresholds, structured logging policy, and incident response playbooks.

---

## 7. Important Legal Disclaimer

> **Indicative Information**: This platform provides information and recommendation assistance based on citizen-provided inputs. Eligibility shown is indicative and **does not guarantee government approval or disbursement**. Final approval is determined solely by the respective department or institution.
