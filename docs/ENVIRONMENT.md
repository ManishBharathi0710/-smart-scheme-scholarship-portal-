# Environment Configuration Reference

This document catalogs every environment variable used across the portal, their requirements, default values, and target environments.

---

## Backend Environment Variables

| Variable | Description | Required | Default | Environment |
| :--- | :--- | :---: | :--- | :--- |
| `NODE_ENV` | Application runtime environment | Yes | `development` | dev, staging, prod |
| `PORT` | HTTP server listening port | No | `5001` | dev, staging, prod |
| `API_PREFIX` | Versioned route base path | No | `/api/v1` | dev, staging, prod |
| `DATABASE_URL` | PostgreSQL connection string | Yes | — | dev, staging, prod |
| `DATABASE_POOL_MIN` | Minimum pool connections | No | `2` | staging, prod |
| `DATABASE_POOL_MAX` | Maximum pool connections | No | `10` | staging, prod |
| `DATABASE_TIMEOUT_MS`| Connection query timeout | No | `10000` | dev, staging, prod |
| `FRONTEND_URL` | Base URL of React client | Yes | `http://localhost:5173` | dev, staging, prod |
| `CORS_ORIGINS` | Comma-delimited CORS allowed list| No | `FRONTEND_URL` | dev, staging, prod |
| `LOG_LEVEL` | Pino logger output level | No | `info` (`warn` in prod)| dev, staging, prod |
| `JWT_SECRET` | Secret key for signing access JWT| Yes | — | dev, staging, prod |
| `JWT_EXPIRES_IN` | Access token lifespan | No | `15m` | dev, staging, prod |
| `REFRESH_TOKEN_SECRET`| Secret key for refresh tokens | Yes | — | dev, staging, prod |
| `REFRESH_TOKEN_EXPIRES_IN`| Refresh token lifespan | No | `7d` | dev, staging, prod |
| `DOCUMENT_MAX_SIZE_MB`| Maximum file upload size in MB| No | `10` | dev, staging, prod |
| `DOCUMENT_STORAGE_PATH`| Path to document directory | No | `uploads/documents` | dev, staging, prod |
| `OCR_CONFIDENCE_THRESHOLD`| Minimum confidence score | No | `0.7` | dev, staging, prod |
| `AI_PROVIDER` | AI backend provider | No | `MOCK` (`GEMINI`/`OPENAI`)| dev, staging, prod |
| `AI_MODEL` | AI model identifier | No | `gemini-1.5-flash` | dev, staging, prod |
| `AI_API_KEY` | Secret key for AI provider | If AI enabled | — | dev, staging, prod |
| `EMAIL_PROVIDER` | Transactional email channel | No | `LOG` (`SMTP` in prod)| dev, staging, prod |
| `EMAIL_FROM` | Dispatcher email sender | No | `official@gov.in` | dev, staging, prod |

---

## Frontend Client Environment Variables

> **CRITICAL SECURITY NOTE**: Only variables prefixed with `VITE_` are bundled into client-side JavaScript. Never place database passwords, JWT secrets, or administrative API keys into frontend files.

| Variable | Description | Required | Default |
| :--- | :--- | :---: | :--- |
| `VITE_API_BASE_URL` | Backend HTTP API Gateway endpoint | Yes | `http://localhost:5001/api/v1` |
| `VITE_PORTAL_NAME` | Display name of the public platform | No | `Smart Scheme & Scholarship Recommendation Portal` |
| `VITE_APP_ENV` | Current runtime badge environment | No | `development` |
