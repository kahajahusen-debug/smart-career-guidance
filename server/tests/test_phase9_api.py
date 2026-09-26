import sys
import os
import asyncio
from fastapi.testclient import TestClient

# Ensure test mode is active for deterministic mock fallback when AI_API_KEY is not set
os.environ["TESTING"] = "true"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def run_phase9_tests():
    print("\n==================================================================")
    print("=== Starting Phase 9.5 True General-Purpose AI Assistant Suite ===")
    print("==================================================================")

    # 29. Unauthorized request rejection (Test 29)
    resp = client.post("/api/v1/assistant/chat", json={"message": "What is Python?"})
    assert resp.status_code == 401, f"Expected 401 for unauthorized chat, got {resp.status_code}"
    print("[OK] 29. Unauthorized assistant request properly rejected (401 Unauthorized)")

    # Create User A
    timestamp_id = int(asyncio.get_event_loop().time() * 1000)
    user_a_email = f"user_a_p95_{timestamp_id}@example.com"
    signup_a = client.post("/api/v1/auth/signup", json={
        "full_name": "Phase 9.5 Candidate A",
        "email": user_a_email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert signup_a.status_code == 201, f"User A signup failed: {signup_a.text}"
    token_a = signup_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Setup profile for User A (Full Stack Target)
    client.post("/api/v1/profile", json={
        "full_name": "Phase 9.5 Candidate A",
        "email": user_a_email,
        "current_skills": ["HTML", "CSS"],
        "interests": ["Full Stack Software Engineer"],
        "degree": "B.Tech Computer Science",
        "preferred_category": "IT"
    }, headers=headers_a)

    # 30. Empty message validation (Test 30)
    empty_resp = client.post("/api/v1/assistant/chat", json={"message": "   "}, headers=headers_a)
    assert empty_resp.status_code == 400, f"Expected 400 for empty message, got {empty_resp.status_code}"
    print("[OK] 30. Empty message properly rejected (400 Bad Request)")

    # 1. "What is Python?" (Test 1)
    t1 = client.post("/api/v1/assistant/chat", json={"message": "What is Python?"}, headers=headers_a)
    assert t1.status_code == 200
    m1 = t1.json()["message"]
    assert "Python" in m1 and any(k in m1.lower() for k in ["programming", "interpreted", "language", "high-level"])
    assert "Your target career is Full Stack Software Engineer" not in m1
    print("[OK] 1. 'What is Python?' verified (Direct Python answer)")

    # 2. "What is Java?" (Test 2)
    t2 = client.post("/api/v1/assistant/chat", json={"message": "What is Java?"}, headers=headers_a)
    assert t2.status_code == 200
    m2 = t2.json()["message"]
    assert "Java" in m2 and any(k in m2.lower() for k in ["class-based", "object-oriented", "jvm", "programming", "language"])
    assert "Your target career is Full Stack Software Engineer" not in m2
    print("[OK] 2. 'What is Java?' verified (Direct Java answer)")

    # 3. "What is C?" (Test 3)
    t3 = client.post("/api/v1/assistant/chat", json={"message": "What is C?"}, headers=headers_a)
    assert t3.status_code == 200
    m3 = t3.json()["message"]
    assert "C" in m3 and any(k in m3.lower() for k in ["procedural", "systems", "language", "programming", "low-level"])
    print("[OK] 3. 'What is C?' verified (Direct C answer)")

    # 4. "What is C++?" (Test 4)
    t4 = client.post("/api/v1/assistant/chat", json={"message": "What is C++?"}, headers=headers_a)
    assert t4.status_code == 200
    m4 = t4.json()["message"]
    assert "C++" in m4 and any(k in m4.lower() for k in ["object-oriented", "extension", "stl", "programming", "language"])
    print("[OK] 4. 'What is C++?' verified (Direct C++ answer)")

    # 5. "What is JavaScript?" (Test 5)
    t5 = client.post("/api/v1/assistant/chat", json={"message": "What is JavaScript?"}, headers=headers_a)
    assert t5.status_code == 200
    m5 = t5.json()["message"]
    assert "JavaScript" in m5 and any(k in m5.lower() for k in ["scripting", "web", "dynamic", "language"])
    print("[OK] 5. 'What is JavaScript?' verified (Direct JavaScript answer)")

    # 6. "What is HTML?" (Test 6)
    t6 = client.post("/api/v1/assistant/chat", json={"message": "What is HTML?"}, headers=headers_a)
    assert t6.status_code == 200
    m6 = t6.json()["message"]
    assert "HTML" in m6 and any(k in m6.lower() for k in ["markup", "structure", "web", "hypertext"])
    print("[OK] 6. 'What is HTML?' verified (Direct HTML answer)")

    # 7. "What is CSS?" (Test 7)
    t7 = client.post("/api/v1/assistant/chat", json={"message": "What is CSS?"}, headers=headers_a)
    assert t7.status_code == 200
    m7 = t7.json()["message"]
    assert "CSS" in m7 and any(k in m7.lower() for k in ["style", "stylesheet", "presentation", "layout"])
    print("[OK] 7. 'What is CSS?' verified (Direct CSS answer)")

    # 8. "What is React?" (Test 8)
    t8 = client.post("/api/v1/assistant/chat", json={"message": "What is React?"}, headers=headers_a)
    assert t8.status_code == 200
    m8 = t8.json()["message"]
    assert "React" in m8 and any(k in m8.lower() for k in ["library", "meta", "ui", "component"])
    print("[OK] 8. 'What is React?' verified (Direct React answer)")

    # 9. "What is SQL?" (Test 9)
    t9 = client.post("/api/v1/assistant/chat", json={"message": "What is SQL?"}, headers=headers_a)
    assert t9.status_code == 200
    m9 = t9.json()["message"]
    assert "SQL" in m9 and any(k in m9.lower() for k in ["database", "query", "structured", "relational"])
    print("[OK] 9. 'What is SQL?' verified (Direct SQL answer)")

    # 10. "What is a div tag?" (Test 10)
    t10 = client.post("/api/v1/assistant/chat", json={"message": "What is a div tag?"}, headers=headers_a)
    assert t10.status_code == 200
    m10 = t10.json()["message"]
    assert "div" in m10.lower() and any(k in m10.lower() for k in ["container", "division", "block", "element", "html"])
    assert "Your target career is Full Stack Software Engineer" not in m10
    print("[OK] 10. 'What is a div tag?' verified (Direct HTML div container explanation)")

    # 11. "What is def in Python?" (Test 11)
    t11 = client.post("/api/v1/assistant/chat", json={"message": "What is def in Python?"}, headers=headers_a)
    assert t11.status_code == 200
    m11 = t11.json()["message"]
    assert "def" in m11 and "function" in m11.lower()
    assert "function (" not in m11  # Not JavaScript function syntax
    print("[OK] 11. 'What is def in Python?' verified (Direct Python function explanation)")

    # 12. "What is a function in Java?" (Test 12)
    t12 = client.post("/api/v1/assistant/chat", json={"message": "What is a function in Java?"}, headers=headers_a)
    assert t12.status_code == 200
    m12 = t12.json()["message"]
    assert "Java" in m12 and any(k in m12.lower() for k in ["method", "class", "function", "return"])
    print("[OK] 12. 'What is a function in Java?' verified (Java method explanation)")

    # 13. "What is a pointer in C?" (Test 13)
    t13 = client.post("/api/v1/assistant/chat", json={"message": "What is a pointer in C?"}, headers=headers_a)
    assert t13.status_code == 200
    m13 = t13.json()["message"]
    assert "pointer" in m13.lower() and any(k in m13.lower() for k in ["address", "memory", "variable", "c"])
    print("[OK] 13. 'What is a pointer in C?' verified (C memory pointer explanation)")

    # 14. "What is digital marketing?" (Test 14)
    t14 = client.post("/api/v1/assistant/chat", json={"message": "What is digital marketing?"}, headers=headers_a)
    assert t14.status_code == 200
    m14 = t14.json()["message"]
    assert "marketing" in m14.lower() and any(k in m14.lower() for k in ["seo", "online", "media", "content", "channels"])
    assert "Your target career is Full Stack Software Engineer" not in m14
    print("[OK] 14. 'What is digital marketing?' verified (Direct Non-IT domain explanation)")

    # 15. "What is accounting?" (Test 15)
    t15 = client.post("/api/v1/assistant/chat", json={"message": "What is accounting?"}, headers=headers_a)
    assert t15.status_code == 200
    m15 = t15.json()["message"]
    assert "accounting" in m15.lower() and any(k in m15.lower() for k in ["financial", "transactions", "records", "business"])
    assert "Full Stack" not in m15
    print("[OK] 15. 'What is accounting?' verified (Direct accounting explanation)")

    # 16. "Can a non-IT student learn Python?" (Test 16)
    t16 = client.post("/api/v1/assistant/chat", json={"message": "Can a non-IT student learn Python?"}, headers=headers_a)
    assert t16.status_code == 200
    m16 = t16.json()["message"]
    assert any(k in m16.lower() for k in ["yes", "absolutely", "can learn", "accessible", "readable"])
    print("[OK] 16. 'Can a non-IT student learn Python?' verified (Non-IT guidance)")

    # 17. "Write factorial in Python." (Test 17)
    t17 = client.post("/api/v1/assistant/chat", json={"message": "Write factorial in Python."}, headers=headers_a)
    assert t17.status_code == 200
    m17 = t17.json()["message"]
    assert "factorial" in m17 and "def" in m17
    assert "public class" not in m17  # Python code, not Java
    print("[OK] 17. 'Write factorial in Python.' verified (Python code generation)")

    # 18. "Write factorial in Java." (Test 18)
    t18 = client.post("/api/v1/assistant/chat", json={"message": "Write factorial in Java."}, headers=headers_a)
    assert t18.status_code == 200
    m18 = t18.json()["message"]
    assert "factorial" in m18 and any(k in m18 for k in ["public class", "class", "public static"])
    print("[OK] 18. 'Write factorial in Java.' verified (Java code generation)")

    # 19. "Explain previously generated code." (Test 19)
    t19 = client.post("/api/v1/assistant/chat", json={"message": "Explain previously generated code."}, headers=headers_a)
    assert t19.status_code == 200
    m19 = t19.json()["message"]
    assert any(k in m19.lower() for k in ["function", "method", "recursive", "base case", "breakdown", "line"])
    print("[OK] 19. 'Explain previously generated code.' verified (Contextual code breakdown)")

    # 20. Follow-up question using "this", "that", "it" (Test 20)
    t20 = client.post("/api/v1/assistant/chat", json={"message": "How can I test it?"}, headers=headers_a)
    assert t20.status_code == 200
    m20 = t20.json()["message"]
    assert any(k in m20.lower() for k in ["test", "code", "run", "compiler", "interpreter", "output"])
    print("[OK] 20. Follow-up question using 'it' verified (Multi-turn context resolution)")

    # 21. Telugu question (Test 21)
    t21 = client.post("/api/v1/assistant/chat", json={"message": "ఫంక్షన్ అంటే ఏమిటి?"}, headers=headers_a)
    assert t21.status_code == 200
    m21 = t21.json()["message"]
    assert any('\u0C00' <= c <= '\u0C7F' for c in m21)  # Contains Telugu script
    print("[OK] 21. Telugu question verified (Telugu script response)")

    # 22. Hindi question (Test 22)
    t22 = client.post("/api/v1/assistant/chat", json={"message": "Python mein function kya hai?"}, headers=headers_a)
    assert t22.status_code == 200
    m22 = t22.json()["message"]
    assert any(k in m22 for k in ["हिंदी", "फंक्शन", "उत्तर", "है"]) or "kya" in m22.lower()
    print("[OK] 22. Hindi question verified (Hindi response)")

    # 23. Telugu-English mixed question (Test 23)
    t23 = client.post("/api/v1/assistant/chat", json={"message": "Python lo def keyword enduku use chestaru?"}, headers=headers_a)
    assert t23.status_code == 200
    m23 = t23.json()["message"]
    assert "def" in m23 and any(k in m23.lower() for k in ["function", "create", "lo", "chestaru", "use"])
    print("[OK] 23. Telugu-English question verified (Teluglish response)")

    # 24. Career recommendation question (Test 24)
    t24 = client.post("/api/v1/assistant/chat", json={"message": "What should I learn first for my target career?"}, headers=headers_a)
    assert t24.status_code == 200
    m24 = t24.json()["message"]
    assert any(k in m24 for k in ["Full Stack", "JavaScript", "HTML", "Start with", "sequence"])
    print("[OK] 24. Career recommendation question verified (Profile skill gap personalization)")

    # 25. Portfolio project question (Test 25)
    t25 = client.post("/api/v1/assistant/chat", json={"message": "Which project should I build next?"}, headers=headers_a)
    assert t25.status_code == 200
    m25 = t25.json()["message"]
    assert any(k in m25.lower() for k in ["project", "saas", "board", "priority", "match score"])
    print("[OK] 25. Portfolio project question verified (Phase 8 project recommendation integration)")

    # 26. Interview preparation question (Test 26)
    t26 = client.post("/api/v1/assistant/chat", json={"message": "How should I prepare for an interview?"}, headers=headers_a)
    assert t26.status_code == 200
    m26 = t26.json()["message"]
    assert any(k in m26.lower() for k in ["interview", "mock", "star", "technical", "strategy"])
    print("[OK] 26. Interview preparation question verified (Phase 9 interview prep guidance)")

    # 27. 30-day roadmap question (Test 27)
    t27 = client.post("/api/v1/assistant/chat", json={"message": "Give me a 30-day learning roadmap."}, headers=headers_a)
    assert t27.status_code == 200
    m27 = t27.json()["message"]
    assert any(k in m27 for k in ["30-Day", "WEEK 1", "Week 1", "roadmap"])
    print("[OK] 27. 30-day roadmap question verified (Structured learning roadmap)")

    # 28. User isolation check (Test 28)
    user_b_email = f"user_b_p95_{timestamp_id}@example.com"
    signup_b = client.post("/api/v1/auth/signup", json={
        "full_name": "Phase 9.5 Candidate B",
        "email": user_b_email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token_b = signup_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    hist_b = client.get("/api/v1/assistant/history", headers=headers_b)
    assert hist_b.status_code == 200
    assert len(hist_b.json()["history"]) == 0
    print("[OK] 28. User Isolation verified: User B cannot access User A's conversation history")

    print("\n==================================================================")
    print("=== ALL 30 PHASE 9.5 CONVERSATIONAL AI TESTS PASSED CLEANLY! ===")
    print("==================================================================\n")

if __name__ == "__main__":
    run_phase9_tests()
