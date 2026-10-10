#!/usr/bin/env bash
# ==============================================================================
# Production Smoke Verification Script
# Smart Scheme & Scholarship Recommendation Portal
# ==============================================================================

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:5001}"
FRONTEND_BASE="${FRONTEND_BASE:-http://localhost:5173}"

echo "=================================================="
echo "🚀 Running Production Smoke Tests"
echo "🌐 API Base: ${API_BASE}"
echo "🌐 Frontend Base: ${FRONTEND_BASE}"
echo "=================================================="

PASSED=0
FAILED=0

check_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="$3"

  echo -n "Checking ${name} (${url})... "
  local status_code
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "${url}" || echo "000")

  if [ "${status_code}" -eq "${expected_status}" ]; then
    echo "✅ PASS (${status_code})"
    PASSED=$((PASSED + 1))
  else
    echo "❌ FAIL (Expected ${expected_status}, Got ${status_code})"
    FAILED=$((FAILED + 1))
  fi
}

# 1. Health Probe
check_endpoint "Liveness Probe" "${API_BASE}/health" 200

# 2. Readiness Probe
check_endpoint "Readiness Probe" "${API_BASE}/ready" 200

# 3. API Versioned Health
check_endpoint "API v1 Health" "${API_BASE}/api/v1/health" 200

# 4. Public Scheme Catalog
check_endpoint "Public Schemes Catalog" "${API_BASE}/api/v1/schemes" 200

# 5. Protected Endpoint Rejection (CORS & Auth Guard Verification)
check_endpoint "Admin Analytics Guard (Expect 401 Unauthorized)" "${API_BASE}/api/v1/admin/analytics/overview" 401

echo "=================================================="
echo "📊 Smoke Test Results: ${PASSED} Passed, ${FAILED} Failed"
echo "=================================================="

if [ "${FAILED}" -gt 0 ]; then
  exit 1
fi

echo "✨ All production smoke checks passed successfully."
