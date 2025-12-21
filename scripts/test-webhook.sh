#!/bin/bash

# Test script for Clerk webhook endpoint
# Usage: ./scripts/test-webhook.sh [ngrok-url]

NGROK_URL="${1:-https://d3da604d5c4a.ngrok-free.app}"
WEBHOOK_URL="${NGROK_URL}/api/webhooks/clerk"

echo "Testing Clerk webhook at: ${WEBHOOK_URL}"
echo ""

# Test 1: Check if endpoint is reachable (should return 400 for missing headers)
echo "Test 1: Testing endpoint reachability (no headers)..."
RESPONSE1=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}')

HTTP_STATUS1=$(echo "$RESPONSE1" | grep "HTTP_STATUS" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | sed '/HTTP_STATUS/d')

echo "Status: ${HTTP_STATUS1}"
echo "Response: ${BODY1}"
echo ""

# Test 2: Test with fake headers (should return 400 for invalid signature)
echo "Test 2: Testing with fake headers (invalid signature)..."
TIMESTAMP=$(date +%s)
RESPONSE2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -H "svix-id: test-id-$(date +%s)" \
  -H "svix-timestamp: ${TIMESTAMP}" \
  -H "svix-signature: v1,fake-signature" \
  -d '{
    "type": "user.created",
    "data": {
      "id": "user_test123",
      "email_addresses": [{"email_address": "test@example.com"}],
      "first_name": "Test",
      "last_name": "User"
    }
  }')

HTTP_STATUS2=$(echo "$RESPONSE2" | grep "HTTP_STATUS" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | sed '/HTTP_STATUS/d')

echo "Status: ${HTTP_STATUS2}"
echo "Response: ${BODY2}"
echo ""

# Summary
echo "=== Summary ==="
if [ "$HTTP_STATUS1" = "400" ]; then
  echo "✅ Endpoint is reachable and correctly rejects requests without headers"
else
  echo "⚠️  Unexpected status for test 1: ${HTTP_STATUS1}"
fi

if [ "$HTTP_STATUS2" = "400" ]; then
  echo "✅ Endpoint correctly rejects requests with invalid signatures"
elif [ "$HTTP_STATUS2" = "500" ]; then
  echo "⚠️  Endpoint returns 500 - check:"
  echo "   - Is CLERK_WEBHOOK_SECRET set in environment?"
  echo "   - Is database connection working?"
  echo "   - Check server logs for detailed error"
else
  echo "⚠️  Unexpected status for test 2: ${HTTP_STATUS2}"
fi

echo ""
echo "Note: To test with real Clerk webhook, use Clerk Dashboard → Webhooks → Test"
echo "      Or trigger a real user.created event by signing up a test user"
