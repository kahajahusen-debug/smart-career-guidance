import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        print("--- Starting Phase 2 API Verification ---")

        # 1. Test Health (Phase 1)
        res = client.get("/api/v1/health")
        assert res.status_code == 200, f"Health failed: {res.text}"
        print("[OK] GET /api/v1/health passed")

        # 2. Test Careers (Phase 1)
        res = client.get("/api/v1/careers")
        assert res.status_code == 200, f"Careers failed: {res.text}"
        data = res.json()
        assert "careers" in data and len(data["careers"]) > 0, f"No careers returned: {data}"
        print(f"[OK] GET /api/v1/careers passed ({data['total']} careers found)")

        # 3. Test Questions (Phase 1)
        res = client.get("/api/v1/questions")
        assert res.status_code == 200, f"Questions failed: {res.text}"
        q_data = res.json()
        assert "questions" in q_data and len(q_data["questions"]) > 0, "No questions returned"
        print(f"[OK] GET /api/v1/questions passed ({q_data['total']} questions found)")

        # 4. Test Jobs & Projects (Phase 1)
        res = client.get("/api/v1/jobs")
        assert res.status_code == 200
        res = client.get("/api/v1/projects")
        assert res.status_code == 200
        print("[OK] GET /api/v1/jobs and /api/v1/projects passed")

        # 5. Test Signup (Phase 2)
        email = f"testuser_{int(asyncio.get_event_loop().time()*1000)}@example.com"
        signup_payload = {
            "full_name": "Test Candidate",
            "email": email,
            "password": "testpassword123",
            "confirm_password": "testpassword123"
        }
        res = client.post("/api/v1/auth/signup", json=signup_payload)
        assert res.status_code == 201, f"Signup failed: {res.text}"
        auth_data = res.json()
        assert "access_token" in auth_data, "No access_token returned"
        token = auth_data["access_token"]
        user_id = auth_data["user"]["id"]
        print(f"[OK] POST /api/v1/auth/signup passed (User ID: {user_id})")

        # 6. Test Duplicate Signup Rejection
        res_dup = client.post("/api/v1/auth/signup", json=signup_payload)
        assert res_dup.status_code == 400, "Duplicate signup was not rejected!"
        print("[OK] Duplicate signup properly rejected (400 Bad Request)")

        # 7. Test Login (Phase 2)
        login_payload = {
            "email": email,
            "password": "testpassword123"
        }
        res_log = client.post("/api/v1/auth/login", json=login_payload)
        assert res_log.status_code == 200, f"Login failed: {res_log.text}"
        assert "access_token" in res_log.json()
        print("[OK] POST /api/v1/auth/login passed")

        headers = {"Authorization": f"Bearer {token}"}

        # 8. Test Auth Me (Phase 2)
        res_me = client.get("/api/v1/auth/me", headers=headers)
        assert res_me.status_code == 200, f"Auth Me failed: {res_me.text}"
        assert res_me.json()["email"] == email
        print("[OK] GET /api/v1/auth/me passed")

        # 9. Test Profile Save & Fetch (Phase 2)
        profile_payload = {
            "full_name": "Test Candidate",
            "email": email,
            "education_level": "Master's Degree",
            "degree": "M.S.",
            "branch": "Artificial Intelligence",
            "graduation_year": 2026,
            "current_skills": ["Python", "SQL", "Machine Learning"],
            "interests": ["Data Science", "AI Research"],
            "preferred_category": "IT"
        }
        res_prof = client.post("/api/v1/profile", json=profile_payload, headers=headers)
        assert res_prof.status_code == 200, f"Profile save failed: {res_prof.text}"
        prof_data = res_prof.json()
        assert prof_data["degree"] == "M.S."
        print("[OK] POST /api/v1/profile passed")

        res_prof_get = client.get("/api/v1/profile/me", headers=headers)
        assert res_prof_get.status_code == 200
        assert res_prof_get.json()["branch"] == "Artificial Intelligence"
        print("[OK] GET /api/v1/profile/me passed")

        # 10. Test Assessment Submit & Results (Phase 2)
        answers = {}
        for i, q in enumerate(q_data["questions"][:10]):
            answers[str(q["id"])] = q.get("correct_option_index", 0)

        sub_payload = {"answers": answers}
        res_sub = client.post("/api/v1/assessment/submit", json=sub_payload, headers=headers)
        assert res_sub.status_code == 200, f"Assessment submission failed: {res_sub.text}"
        rec_data = res_sub.json()
        assert "career_recommendations" in rec_data and len(rec_data["career_recommendations"]) > 0
        top_car = rec_data["career_recommendations"][0]
        print(f"[OK] POST /api/v1/assessment/submit passed! (Top Recommendation: {top_car['title']} - {top_car['suitability_score']}%)")

        res_ass_me = client.get("/api/v1/assessment/me", headers=headers)
        assert res_ass_me.status_code == 200
        print("[OK] GET /api/v1/assessment/me passed")

        # 11. Test User Isolation (User B cannot access User A's profile by ID)
        signup_payload_b = {
            "full_name": "User B",
            "email": f"user_b_{int(asyncio.get_event_loop().time()*1000)}@example.com",
            "password": "password123",
            "confirm_password": "password123"
        }
        res_b = client.post("/api/v1/auth/signup", json=signup_payload_b)
        token_b = res_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        res_iso = client.get(f"/api/v1/profile/{user_id}", headers=headers_b)
        assert res_iso.status_code == 403, "User Isolation failed! User B was able to view User A's profile!"
        print("[OK] User isolation verified! User B blocked from accessing User A's data (403 Forbidden)")

        print("\n==============================================")
        print("ALL PHASE 1 AND PHASE 2 BACKEND TESTS PASSED!")
        print("==============================================")

if __name__ == "__main__":
    run_tests()
