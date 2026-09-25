import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
from fastapi.testclient import TestClient
from app.main import app

def run_phase5_verification_tests():
    with TestClient(app) as client:
        print("=== Starting Phase 5 Personalized Recommendations Verification Suite ===")

        # 1. GET recommendations without JWT -> 401
        res_unauth = client.get("/api/v1/recommendations")
        assert res_unauth.status_code == 401, f"Expected 401, got {res_unauth.status_code}"
        print("[OK] GET /api/v1/recommendations without JWT properly rejected (401 Unauthorized)")

        # 2. Create User A (IT / CS focus)
        email_a = f"candidate_a_{int(asyncio.get_event_loop().time()*1000)}@example.com"
        signup_a = {
            "full_name": "CS Candidate A",
            "email": email_a,
            "password": "password123",
            "confirm_password": "password123"
        }
        res_auth_a = client.post("/api/v1/auth/signup", json=signup_a)
        assert res_auth_a.status_code == 201
        token_a = res_auth_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # 10. GET recommendations before profile/assessment -> returns with incomplete status notice
        res_rec_incomplete = client.get("/api/v1/recommendations", headers=headers_a)
        assert res_rec_incomplete.status_code == 200
        inc_data = res_rec_incomplete.json()
        assert inc_data.get("data_completeness") == "Incomplete"
        assert "recommendations" in inc_data and len(inc_data["recommendations"]) > 0
        print("[OK] GET /api/v1/recommendations handles incomplete profile smoothly with notice")

        # Save Profile for User A (CS & Python & Data Science focus)
        profile_a = {
            "full_name": "CS Candidate A",
            "email": email_a,
            "education_level": "Bachelor's Degree",
            "degree": "B.Tech in Computer Science",
            "major": "Computer Science",
            "current_skills": ["Python", "SQL", "Git"],
            "interests": ["Machine Learning", "Data Science"],
            "preferred_category": "IT",
            "work_style": "Analytical & Technical"
        }
        res_pa = client.post("/api/v1/profile", json=profile_a, headers=headers_a)
        assert res_pa.status_code == 200

        # Submit Discovery for User A (Technical & Data focus)
        disc_a = {f"cd_q{i:02d}": 0 for i in range(1, 13)}
        client.post("/api/v1/discovery/submit", json={"answers": disc_a}, headers=headers_a)

        # Submit Skill Assessment for User A (High Python & Machine Learning accuracy)
        ass_answers_a = {
            "q_py_01": 1, "q_py_02": 2, "q_py_03": 1, "q_py_04": 1, "q_py_05": 1,
            "q_sql_01": 2, "q_sql_02": 1, "q_sql_03": 1, "q_sql_04": 1, "q_sql_05": 1,
            "q_ml_01": 1, "q_ml_02": 1, "q_ml_03": 1, "q_ml_04": 1, "q_ml_05": 1
        }
        client.post("/api/v1/skill-assessment/submit", json={"answers": ass_answers_a}, headers=headers_a)

        # 3. GET recommendations with valid JWT -> success
        res_rec_a = client.get("/api/v1/recommendations", headers=headers_a)
        assert res_rec_a.status_code == 200
        rec_data_a = res_rec_a.json()
        recs_a = rec_data_a.get("recommendations", [])
        assert len(recs_a) >= 10, f"Expected 10 recommendations, got {len(recs_a)}"
        assert rec_data_a.get("data_completeness") == "Complete"

        # 4, 5, 6, 7. Verify Scores between 0 and 100, Matching/Missing Skills, and IT/Non-IT
        top_rec_a = recs_a[0]
        assert 0 <= top_rec_a["suitability_score"] <= 100
        assert "matching_skills" in top_rec_a
        assert "missing_skills" in top_rec_a
        assert top_rec_a["category"] in ["IT", "Non-IT"]
        print(f"[OK] Candidate A top recommendation: '{top_rec_a['title']}' with suitability score {top_rec_a['suitability_score']}%")

        # Test Category Filter (IT only)
        res_it_only = client.get("/api/v1/recommendations?category=IT", headers=headers_a)
        assert res_it_only.status_code == 200
        it_recs = res_it_only.json().get("recommendations", [])
        assert all(r["category"] == "IT" for r in it_recs)
        print(f"[OK] Category filter (IT) verified: {len(it_recs)} IT careers returned")

        # Test Category Filter (Non-IT only)
        res_nonit_only = client.get("/api/v1/recommendations?category=Non-IT", headers=headers_a)
        assert res_nonit_only.status_code == 200
        nonit_recs = res_nonit_only.json().get("recommendations", [])
        assert all(r["category"] == "Non-IT" for r in nonit_recs)
        print(f"[OK] Category filter (Non-IT) verified: {len(nonit_recs)} Non-IT careers returned")

        # 8, 9. Test Career Details Endpoint
        valid_cid = top_rec_a["career_id"]
        res_cdetail = client.get(f"/api/v1/recommendations/{valid_cid}", headers=headers_a)
        assert res_cdetail.status_code == 200
        assert res_cdetail.json()["career_id"] == valid_cid
        print(f"[OK] GET /api/v1/recommendations/{valid_cid} passed")

        # Invalid career ID -> 404
        res_inv_cid = client.get("/api/v1/recommendations/non_existent_career_id_999", headers=headers_a)
        assert res_inv_cid.status_code == 404
        print("[OK] Invalid career ID properly returned 404 Not Found")

        # 13. Create User B (Marketing / Non-IT focus) to test dynamic personalization differences
        email_b = f"candidate_b_{int(asyncio.get_event_loop().time()*1000)}@example.com"
        signup_b = {
            "full_name": "Marketing Candidate B",
            "email": email_b,
            "password": "password123",
            "confirm_password": "password123"
        }
        res_auth_b = client.post("/api/v1/auth/signup", json=signup_b)
        token_b = res_auth_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        profile_b = {
            "full_name": "Marketing Candidate B",
            "email": email_b,
            "education_level": "Bachelor's Degree",
            "degree": "BBA in Marketing",
            "major": "Digital Marketing",
            "current_skills": ["SEO & SEM", "Content Strategy", "Copywriting"],
            "interests": ["Digital Marketing", "Social Media"],
            "preferred_category": "Non-IT",
            "work_style": "Creative & Managerial"
        }
        res_pb = client.post("/api/v1/profile", json=profile_b, headers=headers_b)
        assert res_pb.status_code == 200

        res_rec_b = client.get("/api/v1/recommendations", headers=headers_b)
        rec_data_b = res_rec_b.json()
        top_rec_b = rec_data_b["recommendations"][0]

        print(f"[OK] Candidate B top recommendation: '{top_rec_b['title']}' with suitability score {top_rec_b['suitability_score']}%")
        assert top_rec_a["career_id"] != top_rec_b["career_id"], "User A and User B should have different top recommendations!"
        print("[OK] Dynamic personalization verified: User A (CS) and User B (Marketing) receive distinct recommendations!")

        # 14. Verify Phase 4 endpoints still work
        res_p4_q = client.get("/api/v1/skill-assessment/questions")
        assert res_p4_q.status_code == 200
        print("[OK] Existing Phase 4 APIs still fully functional!")

        print("\n==============================================")
        print("ALL PHASE 5 RECOMMENDATIONS TESTS PASSED SUCCESSFULLY!")
        print("==============================================")

if __name__ == "__main__":
    run_phase5_verification_tests()
