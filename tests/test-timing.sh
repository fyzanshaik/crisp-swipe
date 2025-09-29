#!/bin/bash

SESSION_ID="afb08b20-341e-42cb-8f22-12ec65eb70e4"
SESSION_TOKEN="session_1759172223801_qx7b77pto"
COOKIE_FILE="candidate_cookies.txt"

echo "======================================"
echo "TIMING VALIDATION TESTS"
echo "======================================"
echo ""
echo "Session ID: $SESSION_ID"
echo "Session Token: $SESSION_TOKEN"
echo ""

echo "TEST 1: Try to submit Q0 (easy, 20s limit) TOO FAST (at 5 seconds, min is 10s for easy with 50% rule)"
echo "Expected: 400 error - Please spend more time"
echo "--------------------------------------"
sleep 5
curl -X POST "http://localhost:3000/api/candidate/interviews/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d "{\"session_token\": \"$SESSION_TOKEN\", \"question_index\": 0, \"answer\": \"Use curly braces: {expression}\"}" \
  -b "$COOKIE_FILE" -s | python3 -m json.tool
echo ""
echo ""

echo "TEST 2: Submit Q0 after minimum time (at 12 seconds total, > 10s minimum)"
echo "Expected: 200 success, returns Q1"
echo "--------------------------------------"
sleep 7
curl -X POST "http://localhost:3000/api/candidate/interviews/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d "{\"session_token\": \"$SESSION_TOKEN\", \"question_index\": 0, \"answer\": \"Use curly braces: {expression}\"}" \
  -b "$COOKIE_FILE" -s | python3 -m json.tool
echo ""
echo ""

echo "TEST 3: Try to submit Q1 (easy, 20s limit) immediately"
echo "Expected: 400 error - too fast (need 10s more)"
echo "--------------------------------------"
curl -X POST "http://localhost:3000/api/candidate/interviews/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d "{\"session_token\": \"$SESSION_TOKEN\", \"question_index\": 1, \"answer\": \"object\"}" \
  -b "$COOKIE_FILE" -s | python3 -m json.tool
echo ""
echo ""

echo "TEST 4: Wait and submit Q1 properly"
echo "Expected: 200 success, returns Q2 (medium question)"
echo "--------------------------------------"
sleep 12
curl -X POST "http://localhost:3000/api/candidate/interviews/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -d "{\"session_token\": \"$SESSION_TOKEN\", \"question_index\": 1, \"answer\": \"object\"}" \
  -b "$COOKIE_FILE" -s | python3 -m json.tool
echo ""
echo ""

echo "TEST 5: Check active session endpoint"
echo "Expected: Should show Q2, with correct timeRemaining"
echo "--------------------------------------"
curl -X GET "http://localhost:3000/api/candidate/interviews/active" \
  -b "$COOKIE_FILE" -s | python3 -m json.tool
echo ""
echo ""

echo "======================================"
echo "TESTS COMPLETE"
echo "======================================"