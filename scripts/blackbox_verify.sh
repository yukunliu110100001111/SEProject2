#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

API_PORT="${API_PORT:-18080}"
API_BASE="http://127.0.0.1:${API_PORT}"

assert_http() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "[FAIL] ${label}: expected ${expected}, got ${actual}"
    exit 1
  fi
  echo "[PASS] ${label}: ${actual}"
}

extract_token() {
  local username="$1"
  local password="$2"
  curl -sS -X POST "${API_BASE}/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"${username}\",\"password\":\"${password}\"}" | jq -r '.data.token'
}

# 1) Seed realistic data before startup.
bash scripts/seed_realistic_data.sh >/tmp/seed.log 2>&1 || { cat /tmp/seed.log; exit 1; }

# 2) Start Spring Boot.
mvn -f backend/pom.xml -q spring-boot:run -Dspring-boot.run.arguments="--server.port=${API_PORT}" >/tmp/blackbox-app.log 2>&1 &
APP_PID=$!
trap 'kill ${APP_PID} >/dev/null 2>&1 || true' EXIT

# 3) Wait for the service to be ready.
for _ in $(seq 1 90); do
  code=$(curl -s -o /tmp/health.out -w '%{http_code}' "${API_BASE}/health" || true)
  if [[ "$code" == "200" ]]; then
    break
  fi
  sleep 1
done

code=$(curl -s -o /tmp/health.out -w '%{http_code}' "${API_BASE}/health" || true)
assert_http 200 "$code" "health"

# 4) Log in.
customer_token=$(extract_token customer1 123456)
staff_token=$(extract_token staff1 123456)
admin_token=$(extract_token admin1 123456)
[[ "$customer_token" == token-* ]] || { echo "[FAIL] customer login token invalid"; exit 1; }
[[ "$staff_token" == token-* ]] || { echo "[FAIL] staff login token invalid"; exit 1; }
[[ "$admin_token" == token-* ]] || { echo "[FAIL] admin login token invalid"; exit 1; }
echo "[PASS] login tokens"

# 5) Meals and recommendations.
code=$(curl -s -o /tmp/meals.out -w '%{http_code}' "${API_BASE}/meals" -H "Authorization: Bearer ${customer_token}")
assert_http 200 "$code" "list meals"
jq -e '.data | length >= 2' /tmp/meals.out >/dev/null || { echo "[FAIL] meals size"; exit 1; }

code=$(curl -s -o /tmp/reco.out -w '%{http_code}' "${API_BASE}/recommendations?userId=1" -H "Authorization: Bearer ${customer_token}")
assert_http 200 "$code" "recommendations"
jq -e '.data[0].score != null' /tmp/reco.out >/dev/null || { echo "[FAIL] recommendation score missing"; exit 1; }

update_ingredient='{"name":"Chicken","allergens":["nut"]}'
code=$(curl -s -o /tmp/ingredient-allergen.out -w '%{http_code}' -X PUT "${API_BASE}/ingredients/1" -H "Authorization: Bearer ${staff_token}" -H 'Content-Type: application/json' -d "$update_ingredient")
assert_http 200 "$code" "ingredient allergens update"

pref_body='{"targetCalories":1800,"targetProtein":90,"isVegetarian":false,"allergens":["nut"]}'
code=$(curl -s -o /tmp/user-pref.out -w '%{http_code}' -X PUT "${API_BASE}/users/1/preferences" -H "Authorization: Bearer ${customer_token}" -H 'Content-Type: application/json' -d "$pref_body")
assert_http 200 "$code" "user preference with allergens"

code=$(curl -s -o /tmp/user-info.out -w '%{http_code}' "${API_BASE}/users/1" -H "Authorization: Bearer ${customer_token}")
assert_http 200 "$code" "user info"
jq -e '.data.preferences.allergens[0] == "nut"' /tmp/user-info.out >/dev/null || { echo "[FAIL] user allergens missing"; exit 1; }

code=$(curl -s -o /tmp/reco-allergen.out -w '%{http_code}' "${API_BASE}/recommendations?userId=1" -H "Authorization: Bearer ${customer_token}")
assert_http 200 "$code" "recommendations with allergen"
jq -e '.data[] | select(.mealId == 1 and .allergenConflict == true and .reason == "allergen conflict")' /tmp/reco-allergen.out >/dev/null || { echo "[FAIL] allergen preference not applied"; exit 1; }

create_body='{"userId":1,"items":[{"mealId":1,"quantity":1}]}'
code=$(curl -s -o /tmp/order-create.out -w '%{http_code}' -X POST "${API_BASE}/orders" -H "Authorization: Bearer ${customer_token}" -H 'Content-Type: application/json' -d "$create_body")
assert_http 200 "$code" "create order"
order_id=$(jq -r '.data.orderId' /tmp/order-create.out)

code=$(curl -s -o /tmp/order-confirm.out -w '%{http_code}' -X POST "${API_BASE}/orders/${order_id}/confirm" -H "Authorization: Bearer ${customer_token}")
assert_http 200 "$code" "confirm order"

code=$(curl -s -o /tmp/order-reconfirm.out -w '%{http_code}' -X POST "${API_BASE}/orders/${order_id}/confirm" -H "Authorization: Bearer ${customer_token}")
assert_http 409 "$code" "reconfirm conflict"

stock_body='{"currentQty_g":5000,"expiryDate":"2026-03-20"}'
code=$(curl -s -o /tmp/stock.out -w '%{http_code}' -X PUT "${API_BASE}/stock/1" -H "Authorization: Bearer ${staff_token}" -H 'Content-Type: application/json' -d "$stock_body")
assert_http 200 "$code" "update stock"

code=$(curl -s -o /tmp/dash-customer.out -w '%{http_code}' "${API_BASE}/dashboard" -H "Authorization: Bearer ${customer_token}")
assert_http 403 "$code" "dashboard customer forbidden"

code=$(curl -s -o /tmp/dash-admin.out -w '%{http_code}' "${API_BASE}/dashboard" -H "Authorization: Bearer ${admin_token}")
assert_http 200 "$code" "dashboard admin"
jq -e '.data.topMeals and .data.stockUsage and .data.lowCarbonRate != null' /tmp/dash-admin.out >/dev/null || { echo "[FAIL] dashboard schema"; exit 1; }

echo "[PASS] blackbox verification finished"
