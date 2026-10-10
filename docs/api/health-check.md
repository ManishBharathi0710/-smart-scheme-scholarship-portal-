# Health Check API Specification

The Health Check API allows load balancers, container orchestrators (such as Kubernetes or Docker Swarm), and frontend dashboards to monitor system availability.

---

## 1. Full System Health

### `GET /api/v1/health`

Performs end-to-end telemetry verification, including database connection ping.

#### Response (Healthy) — `200 OK`

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "smart-scheme-backend",
    "version": "1.0.0",
    "environment": "development",
    "uptimeSeconds": 142,
    "timestamp": "2026-09-25T15:30:00.000Z",
    "database": {
      "status": "connected",
      "responseTimeMs": 3
    }
  },
  "message": "System is healthy"
}
```

#### Response (Degraded - Database Unavailable) — `503 Service Unavailable`

```json
{
  "success": true,
  "data": {
    "status": "degraded",
    "service": "smart-scheme-backend",
    "version": "1.0.0",
    "environment": "development",
    "uptimeSeconds": 142,
    "timestamp": "2026-09-25T15:30:00.000Z",
    "database": {
      "status": "disconnected"
    }
  },
  "message": "System is degraded"
}
```

---

## 2. Liveness Probe

### `GET /api/v1/health/live`

Verifies that the Node process is active and accepting HTTP requests.

#### Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "status": "alive",
    "timestamp": "2026-09-25T15:30:00.000Z"
  }
}
```

---

## 3. Readiness Probe

### `GET /api/v1/health/ready`

Verifies that all core dependencies (such as PostgreSQL) are ready to handle live traffic.

#### Response (Ready) — `200 OK`

```json
{
  "success": true,
  "data": {
    "ready": true,
    "database": "connected",
    "timestamp": "2026-09-25T15:30:00.000Z"
  }
}
```

#### Response (Not Ready) — `503 Service Unavailable`

```json
{
  "success": false,
  "data": {
    "ready": false,
    "database": "disconnected",
    "timestamp": "2026-09-25T15:30:00.000Z"
  }
}
```
