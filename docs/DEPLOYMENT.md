# Production Deployment Guide

## 1. Prerequisites

- **Container Runtime**: Docker 24.0+ and Docker Compose 2.20+
- **Host OS**: Ubuntu 22.04 LTS or Amazon Linux 2023 recommended
- **Hardware Minimum**: 2 vCPU, 4GB RAM, 40GB SSD
- **Network**: Inbound ports 80/443 open; outbound HTTPS (443) enabled

---

## 2. Docker Compose Production Deployment

### Step 1: Clone and Configure Environment

```bash
git clone https://github.com/ManishBharathi0710/-smart-scheme-scholarship-portal-.git /opt/smart-scheme-portal
cd /opt/smart-scheme-portal

# Copy production template and edit credentials
cp .env.production .env
```

### Step 2: Configure Production Secrets

Edit `.env` and fill the required secrets:
- `DB_USER` and `DB_PASSWORD`: Strong password for PostgreSQL
- `JWT_SECRET`: Generate using `openssl rand -hex 32`
- `REFRESH_TOKEN_SECRET`: Generate using `openssl rand -hex 32`
- `AI_API_KEY`: API key for Gemini or OpenAI (if AI enabled)

### Step 3: Launch Multi-Container Production Stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Run Database Migrations & Production Seeding

```bash
# Apply Prisma migrations
docker compose -f docker-compose.prod.yml exec backend npm run prisma:deploy

# Execute idempotent production reference seed
docker compose -f docker-compose.prod.yml exec backend npm run prisma:seed:prod
```

### Step 5: Verify Deployment with Smoke Tests

```bash
./scripts/smoke-test.sh
```

---

## 3. Zero-Downtime Rolling Update Strategy

For updates without service disruption:

```bash
# 1. Pull latest verified release tag
git fetch --tags
git checkout tags/v1.0.0

# 2. Run non-destructive database migrations
docker compose -f docker-compose.prod.yml exec backend npm run prisma:deploy

# 3. Build new container images in background
docker compose -f docker-compose.prod.yml build

# 4. Trigger rolling restart of application containers
docker compose -f docker-compose.prod.yml up -d --no-deps backend frontend

# 5. Run automated smoke tests
./scripts/smoke-test.sh
```

---

## 4. Rollback Procedure

In the event of an unexpected regression:

```bash
# Roll back to the previous stable release tag
git checkout tags/v0.9.0

# Rebuild and restart application containers
docker compose -f docker-compose.prod.yml up -d --build backend frontend

# Verify service health
curl -f http://localhost:5001/health
```
