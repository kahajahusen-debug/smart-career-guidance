import sys
import os
import asyncio
from fastapi.testclient import TestClient

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def run_multi_topic_assistant_tests():
    print("\n==================================================================")
    print("=== Multi-Topic AI Assistant Comprehensive Test Suite ===")
    print("==================================================================")

    # Setup User with "Full Stack Software Engineer" default context
    timestamp_id = int(asyncio.get_event_loop().time() * 1000)
    user_email = f"multitopic_tester_{timestamp_id}@example.com"
    signup = client.post("/api/v1/auth/signup", json={
        "full_name": "MultiTopic Tester",
        "email": user_email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert signup.status_code == 201, f"Signup failed: {signup.text}"
    token = signup.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Setup Candidate Profile
    client.post("/api/v1/profile", json={
        "full_name": "MultiTopic Tester",
        "email": user_email,
        "current_skills": ["HTML", "CSS"],
        "interests": ["Full Stack Software Engineer"],
        "degree": "B.Tech Computer Science",
        "preferred_category": "IT"
    }, headers=headers)

    # -------------------------------------------------------------
    # Topic 1: What is def in Python?
    # -------------------------------------------------------------
    r1 = client.post("/api/v1/assistant/chat", json={"message": "What is def in Python?"}, headers=headers)
    assert r1.status_code == 200
    d1 = r1.json()
    m1 = d1["message"]
    print("Test 1 Response Preview:\n", m1[:200], "\n---")
    assert "def" in m1
    assert "function" in m1.lower()
    assert "```python" in m1
    # Verify NO generic career paragraph forced
    assert "This concept plays an important role in technology and career development for" not in m1
    assert "Your target career is Full Stack Software Engineer" not in m1
    assert d1["intent"] in ["programming", "concept_explanation"]
    print("[OK] Topic 1: 'What is def in Python?' verified (Direct answer + Python code, no generic career boilerplate)")

    # -------------------------------------------------------------
    # Topic 2: Explain inheritance in Java.
    # -------------------------------------------------------------
    r2 = client.post("/api/v1/assistant/chat", json={"message": "Explain inheritance in Java."}, headers=headers)
    assert r2.status_code == 200
    d2 = r2.json()
    m2 = d2["message"]
    print("Test 2 Response Preview:\n", m2[:200], "\n---")
    assert "inheritance" in m2.lower()
    assert "extends" in m2.lower()
    assert any(k in m2.lower() for k in ["superclass", "subclass", "parent", "child", "override"])
    assert "```java" in m2
    # Verify NO generic career paragraph forced
    assert "This concept plays an important role in technology and career development for" not in m2
    assert "Your target career is Full Stack Software Engineer" not in m2
    print("D2 INTENT:", repr(d2.get("intent")))
    assert d2["intent"] in ["concept_explanation", "programming"]
    print("[OK] Topic 2: 'Explain inheritance in Java.' verified (Direct Java explanation + extends code, no career boilerplate)")

    # -------------------------------------------------------------
    # Topic 3: What is MongoDB?
    # -------------------------------------------------------------
    r3 = client.post("/api/v1/assistant/chat", json={"message": "What is MongoDB?"}, headers=headers)
    assert r3.status_code == 200
    d3 = r3.json()
    m3 = d3["message"]
    print("Test 3 Response Preview:\n", m3[:200], "\n---")
    assert "mongodb" in m3.lower()
    assert any(k in m3.lower() for k in ["nosql", "document", "bson", "collection"])
    assert "This concept plays an important role in technology and career development for" not in m3
    assert "Your target career is Full Stack Software Engineer" not in m3
    assert d3["intent"] in ["technical", "concept_explanation"]
    print("[OK] Topic 3: 'What is MongoDB?' verified (Direct NoSQL/Document explanation + sample, no career boilerplate)")

    # -------------------------------------------------------------
    # Topic 4: Explain supervised learning.
    # -------------------------------------------------------------
    r4 = client.post("/api/v1/assistant/chat", json={"message": "Explain supervised learning."}, headers=headers)
    assert r4.status_code == 200
    d4 = r4.json()
    m4 = d4["message"]
    print("Test 4 Response Preview:\n", m4[:200], "\n---")
    assert "supervised learning" in m4.lower()
    assert any(k in m4.lower() for k in ["labeled", "labels", "classification", "regression"])
    assert "This concept plays an important role in technology and career development for" not in m4
    assert "Your target career is Full Stack Software Engineer" not in m4
    assert d4["intent"] in ["concept_explanation", "academic"]
    print("[OK] Topic 4: 'Explain supervised learning.' verified (Direct ML theory, classification & regression)")

    # -------------------------------------------------------------
    # Topic 5: What is probability?
    # -------------------------------------------------------------
    r5 = client.post("/api/v1/assistant/chat", json={"message": "What is probability?"}, headers=headers)
    assert r5.status_code == 200
    d5 = r5.json()
    m5 = d5["message"]
    print("Test 5 Response Preview:\n", m5[:200], "\n---")
    assert "probability" in m5.lower()
    assert any(k in m5.lower() for k in ["likelihood", "chance", "outcomes", "favorable", "sample space"])
    assert "This concept plays an important role in technology and career development for" not in m5
    assert "Your target career is Full Stack Software Engineer" not in m5
    assert d5["intent"] in ["academic", "concept_explanation"]
    print("[OK] Topic 5: 'What is probability?' verified (Mathematics definition, formula & examples)")

    # -------------------------------------------------------------
    # Topic 6: What is React?
    # -------------------------------------------------------------
    r6 = client.post("/api/v1/assistant/chat", json={"message": "What is React?"}, headers=headers)
    assert r6.status_code == 200
    d6 = r6.json()
    m6 = d6["message"]
    print("Test 6 Response Preview:\n", m6[:200], "\n---")
    assert "react" in m6.lower()
    assert any(k in m6.lower() for k in ["component", "virtual dom", "ui", "library", "javascript"])
    assert "This concept plays an important role in technology and career development for" not in m6
    assert d6["intent"] in ["technical", "concept_explanation"]
    print("[OK] Topic 6: 'What is React?' verified (Frontend library, components, virtual DOM)")

    # -------------------------------------------------------------
    # Topic 7: How can I become a Data Scientist?
    # -------------------------------------------------------------
    r7 = client.post("/api/v1/assistant/chat", json={"message": "How can I become a Data Scientist?"}, headers=headers)
    assert r7.status_code == 200
    d7 = r7.json()
    m7 = d7["message"]
    print("Test 7 Response Preview:\n", m7[:200], "\n---")
    assert "data scientist" in m7.lower()
    assert any(k in m7.lower() for k in ["python", "statistics", "machine learning", "roadmap", "pandas", "sql"])
    assert d7["intent"] == "career_guidance"
    print("[OK] Topic 7: 'How can I become a Data Scientist?' verified (Actionable multi-phase career roadmap)")

    # -------------------------------------------------------------
    # Topic 8: Give me Python interview questions.
    # -------------------------------------------------------------
    r8 = client.post("/api/v1/assistant/chat", json={"message": "Give me Python interview questions."}, headers=headers)
    assert r8.status_code == 200
    d8 = r8.json()
    m8 = d8["message"]
    print("Test 8 Response Preview:\n", m8[:200], "\n---")
    assert "python" in m8.lower()
    assert any(k in m8.lower() for k in ["list", "tuple", "gil", "decorator", "mutable", "*args"])
    assert "This concept plays an important role in technology and career development for" not in m8
    # Notice: User asked Python interview questions, NOT Full Stack / JavaScript / React interview prep!
    assert "Interview Preparation Strategy for Full Stack Software Engineer" not in m8
    assert d8["intent"] == "interview_prep"
    print("[OK] Topic 8: 'Give me Python interview questions.' verified (Top technical Python questions with answers)")

    # -------------------------------------------------------------
    # Topic 9: Explain it with an example. (Follow-up)
    # -------------------------------------------------------------
    # Let's ask a fresh concept first: "Explain inheritance in Java."
    client.post("/api/v1/assistant/chat", json={"message": "Explain inheritance in Java."}, headers=headers)
    # Now follow-up immediately with: "Explain it with an example."
    r9 = client.post("/api/v1/assistant/chat", json={"message": "Explain it with an example."}, headers=headers)
    assert r9.status_code == 200
    d9 = r9.json()
    m9 = d9["message"]
    print("Test 9 Response Preview:\n", m9[:200], "\n---")
    assert "inheritance" in m9.lower() or "extends" in m9.lower() or "animal" in m9.lower() or "class" in m9.lower()
    assert "```java" in m9
    assert "This concept plays an important role in technology and career development for" not in m9
    assert d9["intent"] == "follow_up"
    print("[OK] Topic 9: 'Explain it with an example.' verified (Follow-up resolved to Java inheritance with code example)")

    # -------------------------------------------------------------
    # Topic 10: Help me debug this Python code.
    # -------------------------------------------------------------
    r10 = client.post("/api/v1/assistant/chat", json={"message": "Help me debug this Python code."}, headers=headers)
    assert r10.status_code == 200
    d10 = r10.json()
    m10 = d10["message"]
    print("Test 10 Response Preview:\n", m10[:200], "\n---")
    assert any(k in m10.lower() for k in ["debug", "error", "indentationerror", "code snippet", "traceback"])
    assert "This concept plays an important role in technology and career development for" not in m10
    assert d10["intent"] == "debugging"
    print("[OK] Topic 10: 'Help me debug this Python code.' verified (Debugging assistance & common Python bug resolutions)")

    # -------------------------------------------------------------
    # Topic 10b: Code Debugging with actual code snippet
    # -------------------------------------------------------------
    broken_code_msg = "Help me debug this Python code:\ndef calculate(n)\n    return n * 2"
    r10b = client.post("/api/v1/assistant/chat", json={"message": broken_code_msg}, headers=headers)
    assert r10b.status_code == 200
    d10b = r10b.json()
    m10b = d10b["message"]
    assert any(k in m10b.lower() for k in ["syntax", "colon", "indentation", "corrected", "def "])
    print("[OK] Topic 10b: Debugging with code snippet verified (Identified syntax/colon/indentation fix)")

    # -------------------------------------------------------------
    # Metadata Isolation & Non-Career Cleanliness
    # -------------------------------------------------------------
    # For technical/programming queries, next_action_card and related_projects should not force career items
    assert d1["next_action_card"] is None
    assert d2["next_action_card"] is None
    assert d3["next_action_card"] is None
    assert d4["next_action_card"] is None
    assert d5["next_action_card"] is None
    assert len(d1["related_projects"]) == 0
    assert len(d5["related_projects"]) == 0
    print("[OK] Metadata Cleanliness: No next_action_cards or portfolio projects attached to non-career answers")

    # -------------------------------------------------------------
    # User Isolation
    # -------------------------------------------------------------
    user2_email = f"multitopic_user2_{timestamp_id}@example.com"
    signup2 = client.post("/api/v1/auth/signup", json={
        "full_name": "MultiTopic User 2",
        "email": user2_email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    assert signup2.status_code == 201
    headers2 = {"Authorization": f"Bearer {signup2.json()['access_token']}"}
    h2_res = client.get("/api/v1/assistant/history", headers=headers2)
    assert h2_res.status_code == 200
    assert len(h2_res.json()["history"]) == 0
    print("[OK] User Isolation: User 2 history is completely separate from User 1")

    print("\n==================================================================")
    print("=== ALL 10 USER REQUIRED TOPICS & EDGE CASES PASSED CLEANLY! ===")
    print("==================================================================\n")

if __name__ == "__main__":
    run_multi_topic_assistant_tests()
