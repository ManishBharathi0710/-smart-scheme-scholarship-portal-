# Smart Scheme & Scholarship Recommendation Portal

> **A trustworthy, explainable, and modular decision-support platform designed to help students and citizens discover verified government schemes, scholarships, welfare programs, subsidies, and educational benefits.**

[![Module 1: Complete](https://img.shields.io/badge/Module%201-Foundation%20%26%20Architecture-emerald.svg)](#)
[![Module 2: Complete](https://img.shields.io/badge/Module%202-Auth%20%26%20User%20Profile-emerald.svg)](#)
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
* **Testing**: Vitest, React Testing Library, jsdom

### Backend
* **Runtime**: Node.js (v18+) with TypeScript
* **Server**: Express v4
* **Database & ORM**: PostgreSQL, Prisma ORM
* **Authentication**: Short-lived JWT access tokens + SHA-256 hashed refresh tokens with rotation
* **Password Hashing**: Bcrypt (cost factor 12)
* **Logging**: Pino with structured JSON and sensitive data redaction
* **Validation**: Zod schema validation middleware (body, query, params)
* **Security**: Helmet, CORS, Brute-Force Rate Limiting (`authRateLimiter`), Request Correlation IDs
* **Testing**: Vitest, Supertest

---

## 3. Repository Structure

```text
smart-scheme-portal/
├── frontend/                     # React + Vite + TypeScript application
│   ├── src/
│   │   ├── components/ui/        # Reusable design system (Button, Modal, Card, Input, etc.)
│   │   ├── components/common/    # ErrorBoundary, ProtectedRoute, layout helpers
│   │   ├── config/               # Environment configuration (Zod validated)
│   │   ├── features/auth/        # Auth context, api, pages (Login, Register, Forgot/Reset)
│   │   ├── features/profile/     # Profile api, 8-section tabbed ProfilePage
│   │   ├── layouts/              # Header, Footer, RootLayout
│   │   ├── lib/                  # Axios API client, TanStack QueryClient
│   │   ├── pages/                # HomePage, DashboardPage, NotFoundPage
│   │   ├── routes/               # React Router route tree with ProtectedRoute
│   │   └── types/                # Standardized API response & profile contracts
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Node.js + Express + TypeScript modular monolith
│   ├── src/
│   │   ├── config/               # Environment configuration (Zod validated)
│   │   ├── database/             # Prisma client & BaseRepository with transactions
│   │   ├── errors/               # AppError hierarchy & status mappings
│   │   ├── middleware/           # authenticate, authorize, rate-limiter, validate, error-handler
│   │   ├── modules/auth/         # Auth controller, service, repository, routes, schemas, utils
│   │   ├── modules/profile/      # Profile controller, service, repository, routes, schemas
│   │   ├── modules/health/       # Health check repository, service, controller, routes
│   │   ├── routes/               # API v1 router mounting /auth, /profile, /consents, /health
│   │   ├── types/                # Standard API response interfaces
│   │   ├── utils/                # Structured Pino logger
│   │   ├── app.ts                # Express app factory
│   │   └── server.ts             # Server entrypoint & graceful shutdown
│   ├── prisma/                   # PostgreSQL schema definition & migrations
│   ├── tests/                    # Integration and unit tests (auth, profile, rbac, health)
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml            # Local PostgreSQL development database
├── .env.example                  # Environment template
└── README.md
```

---

## 4. Quick Start & Development

### 1. Prerequisites
* Node.js >= 18.0.0
* npm >= 9.0.0
* Docker (for local PostgreSQL)

### 2. Configure Environment
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Start Database & Run Migrations
```bash
# Start PostgreSQL via Docker
docker compose up -d postgres

# Run Prisma migrations & generate client
npm --prefix backend run prisma:migrate
npm --prefix backend run prisma:generate
```

### 4. Install & Run
From the root directory:
```bash
# Terminal 1: Backend (runs on port 5001 due to macOS AirPlay Receiver)
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

* Frontend: `http://localhost:5173`
* Backend API: `http://localhost:5001/api/v1`
* Health Check: `http://localhost:5001/api/v1/health`

---

## 5. Verification & Testing

Both frontend and backend include automated test suites:

```bash
# Run all tests (backend 22 tests + frontend 11 tests = 33 tests)
npm test

# Run all linters (backend ESLint + frontend ESLint with 0 warnings)
npm run lint

# Run full production builds (backend tsc + frontend tsc & vite)
npm run build
```

---

## 6. Ten-Module Roadmap

* [x] **MODULE 1**: Foundation & System Architecture *(Complete)*
* [x] **MODULE 2**: Authentication, Authorization & User Profile *(Complete)*
* [ ] **MODULE 3**: Scheme & Scholarship Management *(Next)*
* [ ] **MODULE 4**: Rule-Based Recommendation Engine
* [ ] **MODULE 5**: Scheme Discovery, Search & Personalized Dashboard
* [ ] **MODULE 6**: Document, OCR & Verification System
* [ ] **MODULE 7**: Notifications, Deadlines & Application Assistance
* [ ] **MODULE 8**: AI Assistant, Multilingual & Accessibility Layer
* [ ] **MODULE 9**: Administration, Verification, Analytics & Audit
* [ ] **MODULE 10**: Production Deployment, Security, Testing & Scalability

---

## 7. Important Legal Disclaimer

> **Indicative Information**: This platform provides information and recommendation assistance based on citizen-provided inputs. Eligibility shown is indicative and **does not guarantee government approval or disbursement**. Final approval is determined solely by the respective department or institution.
# -smart-scheme-scholarship-portal-
