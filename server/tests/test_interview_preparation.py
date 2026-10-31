import os
import sys
import unittest
import asyncio

# Ensure unicode stdout on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

os.environ["TESTING"] = "1"
os.environ["PYTHONPATH"] = "server"

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import in_memory_store, db
from app.core.security import create_access_token
from app.services.ai_service import evaluate_interview_answer, generate_interview_questions

import time

client = TestClient(app)
ts = int(time.time() * 1000)
user_a_email = f"candidate_a_{ts}@example.com"
signup_a = client.post("/api/v1/auth/signup", json={
    "full_name": "Test Candidate One",
    "email": user_a_email,
    "password": "Password123!",
    "confirm_password": "Password123!"
})
assert signup_a.status_code == 201, f"Failed signup A: {signup_a.text}"
token_a = signup_a.json()["access_token"]
headers_a = {"Authorization": f"Bearer {token_a}"}

# Signup User B
user_b_email = f"candidate_b_{ts}@example.com"
signup_b = client.post("/api/v1/auth/signup", json={
    "full_name": "Test Candidate Two",
    "email": user_b_email,
    "password": "Password123!",
    "confirm_password": "Password123!"
})
assert signup_b.status_code == 201, f"Failed signup B: {signup_b.text}"
token_b = signup_b.json()["access_token"]
headers_b = {"Authorization": f"Bearer {token_b}"}

def test_interview_suite():
    print("\n" + "="*70)
    print("RUNNING INTERVIEW PREPARATION REDESIGN VERIFICATION SUITE")
    print("="*70)

    # -------------------------------------------------------------
    # 1. TEST DIRECT EVALUATION (CORRECT, PARTIAL, INCORRECT, EMPTY)
    # -------------------------------------------------------------
    print("\n--- 1. Testing AI Answer Evaluation Rubric (1.0 / 0.5 / 0.0) ---")
    
    # 1a. Correct Answer
    q_monolith = "What are the trade-offs between monolithic vs microservices architecture for a Full Stack Software Engineer solution?"
    correct_ans = (
        "Monoliths have a single unified codebase which is easier to develop and deploy initially, "
        "but they can become difficult to scale and have single points of failure. "
        "Microservices decouple components into independent services that scale separately, "
        "but they introduce distributed network latency and operational complexity."
    )
    res_correct = asyncio.run(evaluate_interview_answer(
        question=q_monolith,
        user_answer=correct_ans,
        target_career="Full Stack Software Engineer",
        difficulty="Intermediate"
    ))
    print(f"Correct Answer Eval -> Status: {res_correct['status']}, Score: {res_correct['score']}")
    assert res_correct["status"] == "Correct", f"Expected Correct, got {res_correct['status']}"
    assert res_correct["score"] == 1.0, f"Expected 1.0, got {res_correct['score']}"
    assert res_correct["expected_answer"], "Expected non-empty expected_answer"
    assert "feedback" in res_correct and len(res_correct["feedback"]) > 5
    print("[OK] Correct Answer: Awarded 1.0 point, status 'Correct'")

    # 1b. Partially Correct Answer
    partial_ans = "Microservices are smaller services that can scale separately across servers."
    res_partial = asyncio.run(evaluate_interview_answer(
        question=q_monolith,
        user_answer=partial_ans,
        target_career="Full Stack Software Engineer",
        difficulty="Intermediate"
    ))
    print(f"Partial Answer Eval -> Status: {res_partial['status']}, Score: {res_partial['score']}")
    assert res_partial["status"] == "Partially Correct", f"Expected Partially Correct, got {res_partial['status']}"
    assert res_partial["score"] == 0.5, f"Expected 0.5, got {res_partial['score']}"
    assert len(res_partial["missing_points"]) > 0, "Expected missing_points for partially correct answer"
    print("[OK] Partially Correct Answer: Awarded 0.5 points, status 'Partially Correct' with missing points")

    # 1c. Incorrect Answer (Irrelevant / Nonsense)
    incorrect_ans = "I like eating pepperoni pizza on Friday nights with soda."
    res_incorrect = asyncio.run(evaluate_interview_answer(
        question=q_monolith,
        user_answer=incorrect_ans,
        target_career="Full Stack Software Engineer",
        difficulty="Intermediate"
    ))
    print(f"Incorrect Answer Eval -> Status: {res_incorrect['status']}, Score: {res_incorrect['score']}")
    assert res_incorrect["status"] == "Incorrect", f"Expected Incorrect, got {res_incorrect['status']}"
    assert res_incorrect["score"] == 0.0, f"Expected 0.0, got {res_incorrect['score']}"
    print("[OK] Incorrect Answer: Awarded 0.0 points, status 'Incorrect'")

    # 1d. Empty Answer
    res_empty = asyncio.run(evaluate_interview_answer(
        question=q_monolith,
        user_answer="",
        target_career="Full Stack Software Engineer",
        difficulty="Intermediate"
    ))
    print(f"Empty Answer Eval -> Status: {res_empty['status']}, Score: {res_empty['score']}")
    assert res_empty["status"] == "Incorrect", f"Expected Incorrect for empty answer, got {res_empty['status']}"
    assert res_empty["score"] == 0.0, f"Expected 0.0, got {res_empty['score']}"
    assert "No answer" in res_empty["feedback"], "Expected feedback indicating no answer provided"
    print("[OK] Empty Answer: Awarded 0.0 points, status 'Incorrect' without crashing")

    # -------------------------------------------------------------
    # 2. TEST 5-QUESTION SESSION (TARGET SCORE OUT OF 5)
    # -------------------------------------------------------------
    print("\n--- 2. Testing 5-Question Session (Target Score out of 5) ---")
    start_payload_5 = {
        "target_career": "Full Stack Software Engineer",
        "difficulty": "Intermediate",
        "total_questions": 5
    }
    r = client.post("/api/v1/interview/start", json=start_payload_5, headers=headers_a)
    assert r.status_code == 200, f"Failed to start session: {r.text}"
    s5 = r.json()["session"]
    sess5_id = s5["session_id"]
    assert s5["total_questions"] == 5
    assert len(s5["questions"]) == 5
    assert s5["current_question"] == 1
    assert s5["status"] == "In Progress"
    print(f"[OK] 5-Question Session created: ID={sess5_id}")

    # Answer Q1: Scalable architecture -> Correct (+1)
    q1_ans = "A scalable architecture separates the presentation layer from business logic and data persistence. It uses stateless application servers behind load balancers, database read/write replicas, distributed caching with Redis, and message queues to handle concurrent traffic."
    ans1 = client.post(f"/api/v1/interview/{sess5_id}/answer", json={"answer": q1_ans}, headers=headers_a).json()
    assert ans1["evaluation"]["status"] == "Correct", f"Expected Correct, got {ans1['evaluation']['status']}"
    assert ans1["evaluation"]["score"] == 1.0

    # Answer Q2: Data persistence & state -> Correct (+1)
    q2_ans = "Data persistence is managed using relational databases like PostgreSQL with connection pooling and transactions. Application state is handled with Redux on the frontend and distributed Redis cache on the backend."
    ans2 = client.post(f"/api/v1/interview/{sess5_id}/answer", json={"answer": q2_ans}, headers=headers_a).json()
    assert ans2["evaluation"]["status"] == "Correct", f"Expected Correct, got {ans2['evaluation']['status']}"
    assert ans2["evaluation"]["score"] == 1.0

    # Answer Q3: Secure APIs -> Partially Correct (+0.5)
    q3_partial = "Use JWT tokens and HTTPS."
    ans3 = client.post(f"/api/v1/interview/{sess5_id}/answer", json={"answer": q3_partial}, headers=headers_a).json()
    assert ans3["evaluation"]["status"] == "Partially Correct", f"Expected Partially Correct, got {ans3['evaluation']['status']}"
    assert ans3["evaluation"]["score"] == 0.5

    # Answer Q4: Debugging performance -> Incorrect (0)
    ans4 = client.post(f"/api/v1/interview/{sess5_id}/answer", json={"answer": incorrect_ans}, headers=headers_a).json()
    assert ans4["evaluation"]["status"] == "Incorrect", f"Expected Incorrect, got {ans4['evaluation']['status']}"
    assert ans4["evaluation"]["score"] == 0.0

    # Answer Q5: Database schema design -> Correct (+1) -> Should complete session!
    q5_ans = "Normalize database tables to eliminate redundancy while creating composite indexes on foreign keys to optimize query performance and prevent N+1 queries."
    ans5 = client.post(f"/api/v1/interview/{sess5_id}/answer", json={"answer": q5_ans}, headers=headers_a).json()
    assert ans5["evaluation"]["status"] == "Correct", f"Expected Correct, got {ans5['evaluation']['status']}"
    assert ans5["evaluation"]["score"] == 1.0

    s5_final = ans5["session"]
    assert s5_final["status"] == "Completed"
    # Expected total score: 1 + 1 + 0.5 + 0 + 1 = 3.5 / 5
    assert s5_final["total_score"] == 3.5, f"Expected 3.5, got {s5_final['total_score']}"
    assert s5_final["max_score"] == 5
    assert s5_final["score_display"] == "3.5/5"
    assert s5_final["correct_count"] == 3
    assert s5_final["partially_correct_count"] == 1
    assert s5_final["incorrect_count"] == 1
    assert s5_final["percentage"] == 70.0
    assert "areas_to_improve" in s5_final["performance_summary"]
    print(f"[OK] 5-Question Session Completed: Score={s5_final['score_display']}, Percentage={s5_final['percentage']}%, Performance={s5_final['performance_summary']['performance_tier']}")

    # -------------------------------------------------------------
    # 3. TEST 10-QUESTION SESSION (TARGET SCORE OUT OF 10)
    # -------------------------------------------------------------
    print("\n--- 3. Testing 10-Question Session (Target Score out of 10) ---")
    start_payload_10 = {
        "target_career": "Data Scientist & ML Engineer",
        "difficulty": "Advanced",
        "total_questions": 10
    }
    r10 = client.post("/api/v1/interview/start", json=start_payload_10, headers=headers_a)
    assert r10.status_code == 200
    s10 = r10.json()["session"]
    sess10_id = s10["session_id"]
    assert s10["total_questions"] == 10
    assert len(s10["questions"]) == 10
    print(f"[OK] 10-Question Session created: ID={sess10_id}")

    # Submit 8 correct, 0 partial, 2 incorrect -> Total 8/10
    for i in range(10):
        if i < 8:
            target_q = s10["questions"][i]
            ans_payload = {"answer": target_q.get("expected_answer") or "A scalable architecture separates layers and leverages distributed caches, database read replicas, and stateless services with load balancing."}
        else:
            ans_payload = {"answer": ""} # Empty answer
        res_sub = client.post(f"/api/v1/interview/{sess10_id}/answer", json=ans_payload, headers=headers_a).json()

    s10_final = res_sub["session"]
    print("s10_final total_score:", s10_final.get("total_score"), "scores:", [(q.get("status"), q.get("score")) for q in s10_final["questions"]])
    assert s10_final["status"] == "Completed"
    assert s10_final["total_score"] == 8
    assert s10_final["max_score"] == 10
    assert s10_final["score_display"] == "8/10"
    assert s10_final["percentage"] == 80.0
    assert s10_final["correct_count"] == 8
    assert s10_final["incorrect_count"] == 2
    assert s10_final["performance_summary"]["performance_tier"] == "Excellent"
    print(f"[OK] 10-Question Session Completed: Score={s10_final['score_display']} (80%), Correct={s10_final['correct_count']}, Incorrect={s10_final['incorrect_count']}")

    # -------------------------------------------------------------
    # 4. TEST 15-QUESTION SESSION (TARGET SCORE OUT OF 15)
    # -------------------------------------------------------------
    print("\n--- 4. Testing 15-Question Session (Target Score out of 15) ---")
    start_payload_15 = {
        "target_career": "Full Stack Software Engineer",
        "difficulty": "Intermediate",
        "total_questions": 15
    }
    r15 = client.post("/api/v1/interview/start", json=start_payload_15, headers=headers_a)
    assert r15.status_code == 200
    s15 = r15.json()["session"]
    sess15_id = s15["session_id"]
    assert s15["total_questions"] == 15
    assert len(s15["questions"]) == 15
    print(f"[OK] 15-Question Session created: ID={sess15_id}")

    # Submit 12 correct (1 pt), 0 partial, 3 incorrect (0 pt) -> Total 12/15
    for i in range(15):
        if i < 12:
            target_q = s15["questions"][i]
            ans_payload = {"answer": target_q.get("expected_answer") or "Stateless microservices with distributed caching and database read/write replicas enable high-concurrency scaling."}
        else:
            ans_payload = {"answer": "random text unrelated"}
        res_sub15 = client.post(f"/api/v1/interview/{sess15_id}/answer", json=ans_payload, headers=headers_a).json()

    s15_final = res_sub15["session"]
    assert s15_final["status"] == "Completed"
    assert s15_final["total_score"] == 12
    assert s15_final["max_score"] == 15
    assert s15_final["score_display"] == "12/15"
    assert s15_final["percentage"] == 80.0
    assert s15_final["correct_count"] == 12
    assert s15_final["incorrect_count"] == 3
    print(f"[OK] 15-Question Session Completed: Score={s15_final['score_display']} (80%), Correct={s15_final['correct_count']}, Incorrect={s15_final['incorrect_count']}")

    # -------------------------------------------------------------
    # 5. USER ISOLATION & HISTORY PERSISTENCE
    # -------------------------------------------------------------
    print("\n--- 5. User Isolation & History Persistence ---")
    # User B cannot access User A's session
    forbidden_res = client.get(f"/api/v1/interview/{sess5_id}", headers=headers_b)
    assert forbidden_res.status_code == 403, f"Expected 403 Forbidden, got {forbidden_res.status_code}"
    print("[OK] User isolation enforced: User B blocked from accessing User A's session")

    # User A retrieves history
    hist_res = client.get("/api/v1/interview/history", headers=headers_a)
    assert hist_res.status_code == 200
    user_a_history = hist_res.json()["history"]
    assert len(user_a_history) >= 3, "Expected at least 3 completed sessions in User A history"
    sess_ids = [s["session_id"] for s in user_a_history]
    assert sess5_id in sess_ids and sess10_id in sess_ids and sess15_id in sess_ids
    print(f"[OK] History retrieved successfully: {len(user_a_history)} sessions available for User A")

    print("\n" + "="*70)
    print("ALL BACKEND INTERVIEW PREPARATION TESTS PASSED SUCCESSFULLY! (100%)")
    print("="*70 + "\n")

if __name__ == "__main__":
    test_interview_suite()
