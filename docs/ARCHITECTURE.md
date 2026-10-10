# System Architecture & Technical Specification

## 1. High-Level Architecture Overview

The **Smart Scheme & Scholarship Recommendation Portal** is a production-grade, multi-tiered public service decision-support platform designed to connect citizens with verified welfare and educational entitlements.

```text
                        CITIZENS & ADMINISTRATORS
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │   Cloudflare / CDN    │  HTTPS, TLS 1.3, DDoS & WAF
                       └───────────┬───────────┘
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │  Frontend SPA (React) │  Vite, Tailwind, Accessible UI
                       └───────────┬───────────┘
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │ API Gateway / Reverse │  Nginx / Express Gateway
                       │ Proxy (Helmet, CORS)  │  Rate Limiting, Request Correlation
                       └───────────┬───────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
 ┌──────────────┐          ┌──────────────┐          ┌────────────────┐
 │ Core Logic & │          │ Document &   │          │ Notification & │
 │ Auth Systems │          │ OCR Pipeline │          │ AI Assistance  │
 │ (Modules 1-5)│          │ (Module 6)   │          │ (Modules 7-8)  │
 └──────┬───────┘          └──────┬───────┘          └───────┬────────┘
        │                         │                          │
        └─────────────────────────┼──────────────────────────┘
                                  │
                                  ▼
                       ┌───────────────────────┐
                       │ Observability & Audit │  Append-only Audit Trail,
                       │ (Modules 9 & 10)      │  Diagnostics & Production Ops
                       └───────────┬───────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               ▼                   ▼                   ▼
      ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
      │   PostgreSQL    │ │ Document Vault  │ │ External APIs   │
      │  (Prisma ORM)   │ │ (Encrypted F/S) │ │ (Gemini/OpenAI) │
      └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 2. Architectural Boundaries & Module Ownership

The platform enforces strict separation of concerns across 10 discrete modules:

| Module | Core Responsibility | Truth vs. Assistance |
| :--- | :--- | :--- |
| **Module 1** | Core architecture, authentication, authorization, base health | Ground Truth |
| **Module 2** | Normalized citizen profile (Demographics, Education, Financial, Social) | Ground Truth |
| **Module 3** | Scheme catalog, eligibility rules, lifecycle management | Ground Truth |
| **Module 4** | Deterministic rule-based recommendation evaluation | Ground Truth |
| **Module 5** | Personalized dashboard, discovery search, comparison matrix | Assistance / UX |
| **Module 6** | Document vault, secure upload, anti-tamper OCR extraction | Ground Truth |
| **Module 7** | Deadline notifications, opening alerts, dispatch queues | Ground Truth |
| **Module 8** | Grounded multilingual AI guidance (Zero-hallucination policy) | Assistance / UX |
| **Module 9** | Administrative analytics, conversion funnels, immutable audit logging | Observability |
| **Module 10** | Production deployment, security hardening, reliability, DR & integration | Productionization |

---

## 3. Communication & Security Guarantees

1. **Deterministic Rule Engine**: All eligibility assessments are purely evaluated by deterministic condition evaluators (Module 4). AI (Module 8) never makes or alters eligibility decisions.
2. **Zero-Hallucination AI Grounding**: Assistant answers are strictly verified against deterministic rule engine outputs and database scheme records before delivery to the user.
3. **Data Minimization & Privacy**: Sensitive PII (passwords, full Aadhaar, financial accounts, raw OCR text) is never stored in analytics events, exported without authorization, or passed into third-party AI prompts.
4. **Append-Only Auditing**: Every administrative mutation, state change, and data access query generates an immutable `AuditLog` entry. Privileged audit viewing is itself audited.
