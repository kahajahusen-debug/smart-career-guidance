import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

def test_complete_corrections_flow():
    with TestClient(app) as client:
        ts = int(time.time() * 1000)
        email_new_user = f"newuser_{ts}@example.com"

        print("\n=== SCENARIO 1: Register New User with Career Profile ===")
        signup_payload = {
            "full_name": "Antigravity Student",
            "email": email_new_user,
            "password": "password123",
            "confirm_password": "password123",
            "role": "student",
            "education_level": "Bachelor's Degree",
            "degree": "B.Tech Computer Science",
            "branch": "Computer Science",
            "experience_level": "Student / Fresher",
            "preferred_category": "IT",
            "current_skills": ["Python"],
            "interests": ["Artificial Intelligence"]
        }
        res_signup = client.post("/api/v1/auth/signup", json=signup_payload)
        assert res_signup.status_code == 201, f"Signup failed: {res_signup.text}"
        signup_data = res_signup.json()
        assert "access_token" in signup_data, "access_token missing in signup response"
        token = signup_data["access_token"]
        user = signup_data["user"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"[OK] New user registered successfully: {user['full_name']} ({user['id']})")

        print("\n=== SCENARIO 2: Verify Profile Integrity & Strength ===")
        res_prof = client.get("/api/v1/profile/me", headers=headers)
        assert res_prof.status_code == 200, f"Profile fetch failed: {res_prof.text}"
        prof = res_prof.json()
        assert prof["full_name"] == "Antigravity Student"
        assert prof["education_level"] == "Bachelor's Degree"
        assert prof["degree"] == "B.Tech Computer Science"
        assert prof["experience_level"] == "Student / Fresher"
        assert prof["preferred_category"] == "IT"
        assert prof["current_skills"] == ["Python"]
        assert prof["interests"] == ["Artificial Intelligence"]
        print("[OK] Profile fields preserved accurately in MongoDB without dummy values.")

        print("\n=== SCENARIO 3: Verify New User Has No Fabricated Dashboard Information ===")
        # Check action plan for new user who has not chosen a target career
        res_plan = client.get("/api/v1/action-plan", headers=headers)
        assert res_plan.status_code == 200, f"Action plan fetch failed: {res_plan.text}"
        plan = res_plan.json()
        assert plan.get("status") == "Not Created", f"Expected 'Not Created', got {plan.get('status')}"
        assert plan.get("target_career_title") is None, f"Expected None target career title, got {plan.get('target_career_title')}"
        assert plan.get("has_user_selected_target") is False, "Expected has_user_selected_target to be False"
        assert plan.get("suitability_score") is None, f"Expected None suitability, got {plan.get('suitability_score')}"
        assert plan.get("readiness_score") is None, f"Expected None readiness, got {plan.get('readiness_score')}"
        assert plan.get("overall_progress_pct") == 0, f"Expected 0% overall progress, got {plan.get('overall_progress_pct')}"
        assert len(plan.get("roadmap", [])) == 0, "Expected empty roadmap milestones"
        assert len(plan.get("skill_gaps", [])) == 0, "Expected empty skill gaps"
        print("[OK] New user action plan is clean: Not Created, 0%, no fabricated scores or milestones.")

        # Check recommended projects for new user
        res_proj = client.get("/api/v1/projects/recommended", headers=headers)
        assert res_proj.status_code == 200, f"Projects fetch failed: {res_proj.text}"
        proj_data = res_proj.json()
        summary = proj_data.get("summary", {})
        assert summary.get("in_progress_count") == 0, f"Expected 0 in-progress projects, got {summary.get('in_progress_count')}"
        assert summary.get("completed_count") == 0, f"Expected 0 completed projects, got {summary.get('completed_count')}"
        assert summary.get("portfolio_readiness") == 0.0, f"Expected 0.0 readiness, got {summary.get('portfolio_readiness')}"
        print("[OK] Project progress is 0/3 (0%) for new user, no fabricated project progress.")

        print("\n=== SCENARIO 4: Complete Career Discovery ===")
        disc_answers = {f"cd_q{i:02d}": 1 for i in range(1, 13)}
        res_disc = client.post("/api/v1/discovery/submit", json={"answers": disc_answers}, headers=headers)
        assert res_disc.status_code == 200, f"Discovery submit failed: {res_disc.text}"
        disc_result = res_disc.json()
        assert disc_result["success"] is True
        print("[OK] Career Discovery completed and saved.")

        print("\n=== SCENARIO 5: Complete Skill Assessment ===")
        # Get questions
        res_q = client.get("/api/v1/questions?category=IT")
        assert res_q.status_code == 200
        q_answers = {"q_py_01": 1, "q_py_02": 2, "q_py_03": 1, "q_sql_01": 2, "q_ml_01": 1}
        res_assess = client.post("/api/v1/skill-assessment/submit", json={"answers": q_answers}, headers=headers)
        assert res_assess.status_code == 200, f"Skill assessment failed: {res_assess.text}"
        assess_result = res_assess.json()
        assert assess_result["overall_accuracy"] > 0
        print(f"[OK] Skill assessment completed with accuracy: {assess_result['overall_accuracy']}%")

        print("\n=== SCENARIO 6: Select Target Career & Verify Action Plan Generation ===")
        res_target = client.post("/api/v1/action-plan/regenerate", json={"target_career_id": "car_it_01"}, headers=headers)
        assert res_target.status_code == 200, f"Setting target career failed: {res_target.text}"
        target_info = res_target.json()
        assert target_info["target_career_id"] == "car_it_01"

        # Now fetch action plan again: it should now be created with real target career
        res_plan_after = client.get("/api/v1/action-plan", headers=headers)
        assert res_plan_after.status_code == 200
        plan_after = res_plan_after.json()
        assert plan_after.get("has_user_selected_target") is True
        assert plan_after.get("target_career_id") == "car_it_01"
        assert plan_after.get("target_career_title") == "Full Stack Software Engineer"
        assert len(plan_after.get("roadmap", [])) > 0
        print(f"[OK] Target career Full Stack Software Engineer persisted and Action Plan generated ({len(plan_after['roadmap'])} milestones).")

        print("\n=== SCENARIO 7: Verify User Isolation Against a Second User ===")
        email_user_b = f"user_b_{ts}@example.com"
        res_signup_b = client.post("/api/v1/auth/signup", json={
            "full_name": "User B NonIT",
            "email": email_user_b,
            "password": "password123",
            "confirm_password": "password123",
            "role": "student",
            "education_level": "Bachelor's Degree",
            "degree": "B.Com Finance",
            "branch": "Finance",
            "experience_level": "Student / Fresher",
            "preferred_category": "Non-IT"
        })
        assert res_signup_b.status_code == 201
        token_b = res_signup_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # User B must NOT see User A's action plan or selected target career
        res_plan_b = client.get("/api/v1/action-plan", headers=headers_b)
        assert res_plan_b.status_code == 200
        plan_b = res_plan_b.json()
        assert plan_b.get("status") == "Not Created", f"User B should see 'Not Created', got {plan_b.get('status')}"
        assert plan_b.get("target_career_title") is None, "User B should NOT see User A's career title"
        assert plan_b.get("has_user_selected_target") is False, "User B should not have selected target"

        # User B must NOT see User A's profile
        res_prof_b = client.get("/api/v1/profile/me", headers=headers_b)
        assert res_prof_b.status_code == 200
        prof_b = res_prof_b.json()
        assert prof_b["full_name"] == "User B NonIT"
        assert prof_b["preferred_category"] == "Non-IT"
        print("[OK] Complete User Isolation verified: User B has independent data and clean uncreated action plan.")

        print("\n=============================================================")
        print("ALL E2E CORRECTIONS AND IMPROVEMENTS TEST SCENARIOS PASSED!")
        print("=============================================================\n")

if __name__ == "__main__":
    test_complete_corrections_flow()
