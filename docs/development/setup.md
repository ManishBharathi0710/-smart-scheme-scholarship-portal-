# Developer Onboarding & Setup Guide

## Prerequisites

* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v9.0.0 or higher
* **PostgreSQL**: 15+ (or Docker)

---

## Getting Started

### 1. Clone & Configure Environment

```bash
# Copy example environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Install Dependencies

```bash
# In backend
cd backend
npm install
npx prisma generate

# In frontend
cd ../frontend
npm install
```

### 3. Start Database

```bash
# From workspace root
docker compose up -d postgres
```

### 4. Run Development Servers

In terminal 1 (Backend):
```bash
cd backend
npm run dev
# Server runs on: http://localhost:5000/api/v1
# Health check: http://localhost:5000/api/v1/health
```

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# Frontend runs on: http://localhost:5173
```

---

## Quality Checks

Run all verification suites:

```bash
# From root workspace
npm run lint
npm run test
npm run build
```
