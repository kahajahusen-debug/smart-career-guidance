import sys
import os
import asyncio
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def run_phase9_7_tests():
    print("\n==================================================================")
    print("=== Starting Phase 9.7 Basic Reliable AI Career Assistant Suite ===")
    print("==================================================================")

    # 1. Unauthorized Access (401)
    res = client.post("/api/v1/assistant/chat", json={"message": "Hi"})
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("[OK] 1. Unauthorized request properly rejected (401 Unauthorized)")

    # Signup User A
    timestamp_id = int(asyncio.get_event_loop().time() * 1000)
    user_a_email = f"user97_a_{timestamp_id}@example.com"
    signup_a = client.post("/api/v1/auth/signup", json={
        "full_name": "Phase 9.7 Candidate A",
        "email": user_a_email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert signup_a.status_code == 201
    headers_a = {"Authorization": f"Bearer {signup_a.json()['access_token']}"}

    # 2. Empty Message (400)
    res = client.post("/api/v1/assistant/chat", json={"message": "   "}, headers=headers_a)
    assert res.status_code == 400, f"Expected 400 for empty message, got {res.status_code}"
    print("[OK] 2. Empty message properly rejected (400 Bad Request)")

    # 3. Greeting: 'Hi'
    res = client.post("/api/v1/assistant/chat", json={"message": "Hi"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "Hello" in data["message"] or "Smart Career Guidance" in data["message"]
    print("[OK] 3. 'Hi' greeting handled successfully")

    # 4. Technical Question: 'What is HTML?'
    res = client.post("/api/v1/assistant/chat", json={"message": "What is HTML?"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "HTML" in data["message"]
    assert "HyperText Markup Language" in data["message"] or "markup language" in data["message"].lower()
    print("[OK] 4. 'What is HTML?' direct answer verified")

    # 5. Technical Container Question: 'What is a div tag?'
    res = client.post("/api/v1/assistant/chat", json={"message": "What is a div tag?"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "div" in data["message"].lower()
    assert "```html" in data["message"]
    print("[OK] 5. 'What is a div tag?' HTML container & code block verified")

    # 6. Language Specific Keyword: 'What is def in Python?'
    res = client.post("/api/v1/assistant/chat", json={"message": "What is def in Python?"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "def" in data["message"]
    assert "```python" in data["message"]
    print("[OK] 6. 'What is def in Python?' Python explanation & code block verified")

    # 7. Skill Priority: 'What should I learn first?'
    res = client.post("/api/v1/assistant/chat", json={"message": "What should I learn first?"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert any(sk in data["message"] for sk in ["Git", "JavaScript", "Python", "React", "HTML", "START WITH"])
    assert "Why" in data["message"] and ("Core Topics" in data["message"] or "Task" in data["message"] or "Priority" in data["message"])
    print("[OK] 7. 'What should I learn first?' prioritized skill sequence verified")

    # 8. Follow-up Skill Priority: 'What should I learn next?'
    res = client.post("/api/v1/assistant/chat", json={"message": "What should I learn next?"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    print("DEBUG TEST 8 MESSAGE:", repr(data["message"]))
    assert "next" in data["message"].lower() or "skill" in data["message"].lower() or "priority" in data["message"].lower()
    print("[OK] 8. 'What should I learn next?' follow-up sequence verified")

    # 9. Roadmap Generation: 'Give me a roadmap'
    res = client.post("/api/v1/assistant/chat", json={"message": "Give me a roadmap"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "Roadmap" in data["message"] or "Stage" in data["message"] or "Week" in data["message"]
    print("[OK] 9. 'Give me a roadmap' structured roadmap verified")

    # 10. Portfolio Recommendation: 'What project should I build?'
    res = client.post("/api/v1/assistant/chat", json={"message": "What project should I build?"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "Project" in data["message"] or "Full-Stack" in data["message"]
    assert len(data.get("related_projects", [])) > 0
    print("[OK] 10. 'What project should I build?' portfolio recommendation verified")

    # 11. Interview Prep: 'How should I prepare for an interview?'
    res = client.post("/api/v1/assistant/chat", json={"message": "How should I prepare for an interview?"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "Interview" in data["message"]
    assert "STAR" in data["message"] or "Technical" in data["message"]
    print("[OK] 11. 'How should I prepare for an interview?' strategy verified")

    # 12. Non-IT Career Guidance: 'Can a non-IT student learn Python?'
    res = client.post("/api/v1/assistant/chat", json={"message": "Can a non-IT student learn Python?"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "Non-IT" in data["message"] or "Yes" in data["message"] or "Python" in data["message"]
    print("[OK] 12. 'Can a non-IT student learn Python?' non-IT guidance verified")

    # 13. Contextual Pronoun Resolution: 'Is it difficult?'
    res = client.post("/api/v1/assistant/chat", json={"message": "Is it difficult?"}, headers=headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "Python" in data["message"] or "Difficult" in data["message"] or "Learn" in data["message"]
    print("[OK] 13. Contextual pronoun 'it' resolution verified")

    # 14. Missing Profile Gracefulness (New user without profile)
    user_b_email = f"user97_newbie_{timestamp_id}@example.com"
    signup_b = client.post("/api/v1/auth/signup", json={
        "full_name": "Newbie Candidate B",
        "email": user_b_email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    headers_b = {"Authorization": f"Bearer {signup_b.json()['access_token']}"}
    res = client.post("/api/v1/assistant/chat", json={"message": "What is Python?"}, headers=headers_b)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "Python" in data["message"]
    print("[OK] 14. New user missing profile handled gracefully")

    # 15. User Isolation (User B cannot see User A's history)
    res_b_history = client.get("/api/v1/assistant/history", headers=headers_b)
    assert res_b_history.status_code == 200
    history_b = res_b_history.json()["history"]
    assert len(history_b) == 2  # Only User B's 1 prompt + 1 assistant reply
    print("[OK] 15. User isolation verified: User B history isolated from User A")

    print("==================================================================")
    print("=== ALL 15 PHASE 9.7 BASIC RELIABLE ASSISTANT TESTS PASSED! ===")
    print("==================================================================\n")

if __name__ == "__main__":
    run_phase9_7_tests()
