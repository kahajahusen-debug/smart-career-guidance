import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
from fastapi.testclient import TestClient
from app.main import app

def run_phase6_verification_tests():
    with TestClient(app) as client:
        print("=== Starting Phase 6 Career Action Plan & Roadmap Verification Suite ===")

        # 1. Unauthenticated action-plan request -> 401
        res_unauth = client.get("/api/v1/action-plan")
        assert res_unauth.status_code == 401
        print("[OK] Unauthenticated action plan request properly rejected (401 Unauthorized)")

        # Create Candidate User A
        email_a = f"roadmap_user_{int(asyncio.get_event_loop().time()*1000)}@example.com"
        res_auth_a = client.post("/api/v1/auth/signup", json={
            "full_name": "Roadmap Candidate A",
            "email": email_a,
            "password": "password123",
            "confirm_password": "password123"
        })
        assert res_auth_a.status_code == 201
        token_a = res_auth_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Setup Profile & Assessment for Candidate A
        client.post("/api/v1/profile", json={
            "full_name": "Roadmap Candidate A",
            "email": email_a,
            "education_level": "Bachelor's Degree",
            "degree": "B.Tech CS",
            "current_skills": ["Python", "SQL"],
            "interests": ["Machine Learning"],
            "preferred_category": "IT"
        }, headers=headers_a)

        client.post("/api/v1/skill-assessment/submit", json={
            "answers": {"q_py_01": 1, "q_py_02": 2, "q_py_03": 1, "q_sql_01": 2, "q_ml_01": 1}
        }, headers=headers_a)

        # 2. Authenticated action-plan request -> 200
        res_plan = client.get("/api/v1/action-plan", headers=headers_a)
        assert res_plan.status_code == 200
        plan_data = res_plan.json()
        assert "target_career_title" in plan_data
        assert "roadmap" in plan_data and len(plan_data["roadmap"]) > 0
        assert "readiness_score" in plan_data
        print(f"[OK] GET /api/v1/action-plan passed! Target: '{plan_data['target_career_title']}', Readiness: {plan_data['readiness_score']}%")

        # 3. Skill-gap endpoint -> 200
        res_gaps = client.get("/api/v1/action-plan/skill-gaps", headers=headers_a)
        assert res_gaps.status_code == 200
        assert "skill_gaps" in res_gaps.json()
        print("[OK] GET /api/v1/action-plan/skill-gaps passed")

        # 4. Roadmap endpoint -> 200
        res_rm = client.get("/api/v1/action-plan/roadmap", headers=headers_a)
        assert res_rm.status_code == 200
        assert "roadmap" in res_rm.json()
        print("[OK] GET /api/v1/action-plan/roadmap passed")

        # 5. Project recommendations -> 200
        res_proj = client.get("/api/v1/action-plan/projects", headers=headers_a)
        assert res_proj.status_code == 200
        assert "recommended_projects" in res_proj.json()
        print("[OK] GET /api/v1/action-plan/projects passed")

        # 6. Readiness endpoint -> 200
        res_readiness = client.get("/api/v1/action-plan/readiness", headers=headers_a)
        assert res_readiness.status_code == 200
        assert "readiness_breakdown" in res_readiness.json()
        print("[OK] GET /api/v1/action-plan/readiness passed")

        # 8. Invalid progress status -> 400
        res_bad_status = client.patch("/api/v1/action-plan/progress", json={
            "item_id": plan_data["roadmap"][0]["skill_id"],
            "item_type": "skill",
            "status": "INVALID_STATUS_NAME"
        }, headers=headers_a)
        assert res_bad_status.status_code == 400
        print("[OK] Invalid progress status properly rejected (400 Bad Request)")

        # 9, 10. Progress update -> successful & persists
        target_item_id = plan_data["roadmap"][0]["skill_id"]
        res_update = client.patch("/api/v1/action-plan/progress", json={
            "item_id": target_item_id,
            "item_type": "skill",
            "status": "Completed"
        }, headers=headers_a)
        assert res_update.status_code == 200
        updated_pct = res_update.json()["overall_progress_pct"]
        assert updated_pct > 0
        print(f"[OK] Progress update passed! Item '{target_item_id}' marked Completed (Progress: {updated_pct}%)")

        # Re-fetch action plan to verify persistence
        res_plan_refetch = client.get("/api/v1/action-plan", headers=headers_a)
        refetched = res_plan_refetch.json()
        matching_item = next(i for i in refetched["roadmap"] if i["skill_id"] == target_item_id)
        assert matching_item["status"] == "Completed"
        print("[OK] Progress status verified persisted in storage!")

        # 7, 12. Regeneration & Invalid career ID check
        res_bad_regen = client.post("/api/v1/action-plan/regenerate", json={
            "target_career_id": "non_existent_career_id_999"
        }, headers=headers_a)
        assert res_bad_regen.status_code == 404
        print("[OK] Regeneration with invalid career ID properly returned 404 Not Found")

        res_regen_ok = client.post("/api/v1/action-plan/regenerate", json={
            "target_career_id": "car_it_01"
        }, headers=headers_a)
        assert res_regen_ok.status_code == 200
        assert res_regen_ok.json()["target_career_id"] == "car_it_01"
        print("[OK] Regeneration with valid target career ID ('car_it_01') succeeded!")

        # 11. User isolation check
        email_b = f"roadmap_b_{int(asyncio.get_event_loop().time()*1000)}@example.com"
        res_auth_b = client.post("/api/v1/auth/signup", json={
            "full_name": "Roadmap Candidate B",
            "email": email_b,
            "password": "password123",
            "confirm_password": "password123"
        })
        token_b = res_auth_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        res_plan_b = client.get("/api/v1/action-plan", headers=headers_b)
        assert res_plan_b.status_code == 200
        assert res_plan_b.json()["user_id"] != plan_data["user_id"], "User B action plan must be isolated from User A!"
        print("[OK] User isolation verified: User A and User B action plans are strictly separate!")

        print("\n==============================================")
        print("ALL PHASE 6 ACTION PLAN TESTS PASSED SUCCESSFULLY!")
        print("==============================================")

if __name__ == "__main__":
    run_phase6_verification_tests()
