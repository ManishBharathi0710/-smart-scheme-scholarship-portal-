# Database Architecture & Setup

## Overview

The portal uses **PostgreSQL** with **Prisma ORM** as the database layer to ensure relational integrity, strict constraints, and transactional consistency for eligibility rules and citizen profiles.

---

## 1. Naming & Type Conventions

* **Column Names**: `snake_case` (mapped using `@map("column_name")`).
* **Table Names**: `snake_case` plural (mapped using `@@map("table_names")`).
* **Primary Keys**: UUID v4 (`@id @default(uuid()) @db.Uuid`).
* **Timestamps**: UTC timestamp with timezone (`@db.Timestamptz(6)`), `created_at` default `now()`.

---

## 2. Running PostgreSQL via Docker

A `docker-compose.yml` file is provided in the repository root:

```bash
# Start PostgreSQL container
docker compose up -d postgres

# Check container status
docker compose ps
```

---

## 3. Prisma Commands

All Prisma commands are run from the `backend/` directory:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run development migrations
npm run prisma:migrate

# Deploy production migrations
npm run prisma:deploy

# Open Prisma Studio GUI
npm run prisma:studio
```

---

## 4. Connection Resiliency

The backend implements `checkDatabaseConnection()` at startup and in the health check repository. If the database is offline or restarting, the server starts in **degraded mode** rather than crashing with unhandled exceptions.
