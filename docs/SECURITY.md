# Security Posture, Policies & Hardening Matrix

## 1. Threat Model & Security Posture

The **Smart Scheme & Scholarship Recommendation Portal** adheres to the Indian Digital Personal Data Protection (DPDP) Act guidelines and OWASP Top 10 security standards.

---

## 2. Authentication & Session Management

- **Password Hashing**: Bcrypt with 10 salt rounds. Plaintext passwords or legacy MD5/SHA1 are strictly forbidden.
- **Short-Lived Access Tokens**: Signed JWT access tokens with 15-minute expiration.
- **Revocable Refresh Tokens**: Refresh token hashes stored in database with explicit expiry (`7d`) and family rotation.
- **Brute-Force Rate Limiting**: Strict rate limiting on authentication endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/forgot-password`) restricting attempts to 20 requests per 15-minute window per IP.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Endpoint Group | `USER` (Citizen) | `SCHEME_MANAGER` | `VERIFIER` | `ADMIN` / `SUPER_ADMIN` |
| :--- | :---: | :---: | :---: | :---: |
| Public Schemes Catalog | Read | Read | Read | Read |
| Citizen Profile & Documents | Self Only | Denied | Denied | Denied |
| Scheme Creation / Editing | Denied | Allowed | Denied | Allowed |
| Verification Reviews | Denied | Denied | Allowed | Allowed |
| Admin Analytics Overview | Denied | Allowed | Allowed | Allowed |
| Security Audit Logs | Denied | Denied | Denied | Allowed |
| System Health Diagnostics | Denied | Denied | Denied | Allowed |

---

## 4. Document Storage & Anti-Tamper OCR Security

- **Private Storage**: Documents are stored in encrypted directories inaccessible via direct HTTP links.
- **Time-Limited Signed URLs**: Temporary access is granted solely via cryptographically signed tokens with short expiration (300 seconds).
- **Magic Bytes Validation**: File uploads enforce both MIME validation and physical file signature inspection to defeat file extension and MIME spoofing.
- **Size Limits**: Strict 10MB file size ceiling per uploaded document.

---

## 5. Network & HTTP Hardening

- **Security Headers (Helmet)**:
  - `Content-Security-Policy`: Default `'self'`, trusted styles, no unsafe eval.
  - `X-Frame-Options`: `SAMEORIGIN` (prevents clickjacking).
  - `X-Content-Type-Options`: `nosniff` (prevents MIME sniffing).
  - `Referrer-Policy`: `strict-origin-when-cross-origin`.
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`.
- **CORS Restriction**: Explicitly allows only trusted origins in production; wildcard `*` is strictly disallowed on authenticated endpoints.
- **Error Sanitization**: Stack traces and raw internal database errors are completely suppressed in production and staging responses.
