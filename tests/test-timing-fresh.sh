#!/bin/bash

INTERVIEW_ID="19baf148-ed48-49ad-a383-9a7d99d664c7"
RESUME_ID="2d55bd6a-5753-4a08-b093-ecd445d54312"
COOKIE_FILE="candidate_cookies.txt"

echo "======================================"
echo "FRESH TIMING VALIDATION TEST"
echo "======================================"
echo ""

echo "Step 1: Start interview session"
echo "--------------------------------------"
RESPONSE=$(curl -X POST "http://localhost:3000/api/candidate/interviews/$INTERVIEW_ID/start" \
  -H "Content-Type: application/json" \
  -d "{\"resumeId\": \"$RESUME_ID\"}" \
  -b "$COOKIE_FILE" -s)

SESSION_ID=$(echo $RESPONSE | python3 -c "import json, sys; print(json.load(sys.stdin)['sessionId'])")
SESSION_TOKEN=$(echo $RESPONSE | python3 -c "import json, sys; print(json.load(sys.stdin)['sessionToken'])")
Q0_TIME_LIMIT=$(echo $RESPONSE | python3 -c "import json, sys; print(json.load(sys.stdin)['questions'][0]['question']['timeLimit'])")

echo "Session ID: $SESSION_ID"
echo "Session Token: $SESSION_TOKEN"
echo "Q0 Time Limit: ${Q0_TIME_LIMIT}s"
echo "Q0 Minimum Time (50%): $((Q0_TIME_LIMIT / 2))s"
echo ""

echo "Step 2: Wait 4 seconds and try to submit (should FAIL)"
echo "Expected: 400 error - minimum time not reached"
echo "--------------------------------------"
sleep 4
curl -X POST "http://localhost:3000/api/candidate/interviews/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d "{\"session_token\": \"$SESSION_TOKEN\", \"question_index\": 0, \"answer\": \"Use curly braces: {expression}\"}" \
  -b "$COOKIE_FILE" -s | python3 -m json.tool
echo ""

echo "Step 3: Wait total 12 seconds and submit (should SUCCEED)"
echo "Expected: 200 success - returns Q1"
echo "--------------------------------------"
sleep 8
curl -X POST "http://localhost:3000/api/candidate/interviews/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d "{\"session_token\": \"$SESSION_TOKEN\", \"question_index\": 0, \"answer\": \"Use curly braces: {expression}\"}" \
  -b "$COOKIE_FILE" -s | python3 -m json.tool
echo ""

echo "======================================"
echo "TEST COMPLETE"
echo "======================================"