#!/bin/bash

INTERVIEW_ID="ac79db2b-1b40-4dcc-856d-cc46260bbc17"
RESUME_ID="2d55bd6a-5753-4a08-b093-ecd445d54312"
COOKIE_FILE="candidate_cookies.txt"

echo "======================================"
echo "AUTO-ADVANCE LOGIC TEST"
echo "======================================"
echo ""
echo "Testing what happens when user closes browser and time expires"
echo ""

echo "Step 1: Start NEW interview (60s/120s/180s time limits)"
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

echo "Step 2: Wait 70 seconds (> 60s time limit + 5s grace)"
echo "Expected: Q0 time will expire"
echo "--------------------------------------"
echo "Waiting 70 seconds..."
sleep 70
echo "Done waiting!"
echo ""

echo "Step 3: Call GET /interviews/active (simulating page reload)"
echo "Expected: Server auto-advances to Q1, auto-submits empty answer for Q0"
echo "--------------------------------------"
curl -X GET "http://localhost:3000/api/candidate/interviews/active" \
  -b "$COOKIE_FILE" -s | python3 -c "
import json, sys
d = json.load(sys.stdin)
a = d.get('activeSession')
if a:
    print(f'Current Question Index: {a[\"currentQuestionIndex\"]}')
    print(f'Was Auto-Advanced: {a.get(\"wasAutoAdvanced\", False)}')
    print(f'Time Remaining: {a[\"timeRemaining\"]}s')
    print(f'Status: {a.get(\"status\", \"in_progress\")}')
else:
    print('No active session!')
"
echo ""

echo "Step 4: Check if Q0 answer was auto-submitted"
echo "--------------------------------------"
curl -X GET "http://localhost:3000/api/candidate/evaluation-status/$SESSION_ID" \
  -b "$COOKIE_FILE" -s | python3 -c "
import json, sys
d = json.load(sys.stdin)
answers = d.get('answers', [])
print(f'Total Answers: {len(answers)}')
if len(answers) > 0:
    q0 = answers[0]
    print(f'Q0 Answer Text: \"{q0[\"answerText\"]}\"')
    print(f'Q0 Evaluated: {q0[\"evaluated\"]}')
    print(f'Q0 Score: {q0[\"score\"]}')
"
echo ""

echo "======================================"
echo "TEST COMPLETE"
echo "======================================"