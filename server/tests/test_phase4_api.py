import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
from fastapi.testclient import TestClient
from app.main import app

def run_phase4_verification_tests():
    with TestClient(app) as client:
        print("=== Starting Phase 4 Advanced Skill Assessment Verification Suite ===")

        # 1. Test GET /api/v1/skill-assessment/questions
        res_q = client.get("/api/v1/skill-assessment/questions")
        assert res_q.status_code == 200, f"Questions failed: {res_q.text}"
        q_data = res_q.json()
        assert q_data.get("success") is True
        assert "questions" in q_data and len(q_data["questions"]) >= 10
        print(f"[OK] GET /api/v1/skill-assessment/questions passed ({len(q_data['questions'])} questions returned)")

        # 2. Test Unauthenticated Submission Rejection
        res_unauth = client.post("/api/v1/skill-assessment/submit", json={"answers": {"q_py_01": 1}})
        assert res_unauth.status_code == 401
        print("[OK] Unauthenticated skill assessment submission properly rejected (401 Unauthorized)")

        # 3. Create Authenticated Candidate User
        email = f"skill_candidate_{int(asyncio.get_event_loop().time()*1000)}@example.com"
        signup_payload = {
            "full_name": "Skill Assessment Candidate",
            "email": email,
            "password": "password123",
            "confirm_password": "password123"
        }
        res_auth = client.post("/api/v1/auth/signup", json=signup_payload)
        assert res_auth.status_code == 201
        token = res_auth.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"[OK] Test candidate created ({email})")

        # 3b. Test Submission Input Validations
        # Empty submission
        res_empty = client.post("/api/v1/skill-assessment/submit", json={"answers": {}}, headers=headers)
        assert res_empty.status_code == 400
        print("[OK] Empty submission properly rejected (400 Bad Request)")

        # Invalid option index (out of range)
        res_inv_opt = client.post("/api/v1/skill-assessment/submit", json={"answers": {"q_py_01": 99}}, headers=headers)
        assert res_inv_opt.status_code == 400
        print("[OK] Invalid option index properly rejected (400 Bad Request)")

        # Only invalid question IDs
        res_inv_q = client.post("/api/v1/skill-assessment/submit", json={"answers": {"invalid_nonexistent_id": 1}}, headers=headers)
        assert res_inv_q.status_code == 400
        print("[OK] Submission with no valid question IDs properly rejected (400 Bad Request)")

        # 4. First complete Career Discovery (to test connection with Discovery)
        disc_answers = {f"cd_q{i:02d}": 0 for i in range(1, 13)} # Technical heavy
        res_disc = client.post("/api/v1/discovery/submit", json={"answers": disc_answers}, headers=headers)
        assert res_disc.status_code == 200
        print("[OK] Career Discovery completed (Technical / Software top domain)")

        # 5. Submit Skill Assessment Attempt 1
        # Python: 5/5 correct (100% -> Strong / Expert)
        # JavaScript: 4/5 correct (80% -> Strong / Proficient)
        # SQL: 2/5 correct (40% -> Improve / Needs Improvement)
        # Machine Learning: 3/5 correct (60% -> Moderate / Intermediate)
        test_answers = {
            # Python (q_py_01..05 correct_option_index is 1)
            "q_py_01": 1, "q_py_02": 2, "q_py_03": 1, "q_py_04": 1, "q_py_05": 1,
            # JavaScript (q_js_01..05 -> 01:2, 02:2, 03:1, 04:1, 05:0 wrong)
            "q_js_01": 2, "q_js_02": 2, "q_js_03": 1, "q_js_04": 1, "q_js_05": 0,
            # SQL (q_sql_01..05 -> 01:2 correct, 02:1 correct, rest wrong)
            "q_sql_01": 2, "q_sql_02": 1, "q_sql_03": 0, "q_sql_04": 0, "q_sql_05": 0,
            # Machine Learning (q_ml_01..05 -> 01:1, 02:1, 03:1 correct, rest wrong)
            "q_ml_01": 1, "q_ml_02": 1, "q_ml_03": 1, "q_ml_04": 0, "q_ml_05": 0
        }

        res_sub1 = client.post("/api/v1/skill-assessment/submit", json={"answers": test_answers}, headers=headers)
        assert res_sub1.status_code == 200, f"Skill assessment submit failed: {res_sub1.text}"
        res1_data = res_sub1.json()

        # Check overall metrics
        assert res1_data["total_questions"] == 20
        assert res1_data["correct_answers"] == 14 # 5 + 4 + 2 + 3 = 14
        assert res1_data["overall_accuracy"] == 70.0

        # Check strong, moderate, improve skills
        assert "Python" in res1_data["strong_skills"]
        assert "JavaScript" in res1_data["strong_skills"]
        assert "Machine Learning" in res1_data["moderate_skills"]
        assert "SQL" in res1_data["improve_skills"]

        # Check proficiency level labels
        assert res1_data["proficiency_levels"]["Python"] == "Expert"
        assert res1_data["proficiency_levels"]["JavaScript"] == "Proficient"
        assert res1_data["proficiency_levels"]["SQL"] == "Needs Improvement"

        # Check connection with Career Discovery
        disc_align = res1_data.get("discovery_alignment")
        assert disc_align is not None
        assert disc_align["top_interest_area"] == "Technical / Software"
        assert "Python" in disc_align["matching_strong_skills"]
        print(f"[OK] Skill Assessment submitted! Accuracy: {res1_data['overall_accuracy']}%, Strong Skills: {res1_data['strong_skills']}, Discovery Alignment Verified!")

        # 6. Verify GET /api/v1/skill-assessment/me returns latest result
        res_me1 = client.get("/api/v1/skill-assessment/me", headers=headers)
        assert res_me1.status_code == 200
        assert res_me1.json()["overall_accuracy"] == 70.0
        print("[OK] GET /api/v1/skill-assessment/me passed")

        # 7. RETAKE SKILL ASSESSMENT: Attempt 2 (SQL improved to 5/5 -> 100%)
        test_answers_att2 = test_answers.copy()
        test_answers_att2["q_sql_03"] = 1
        test_answers_att2["q_sql_04"] = 1
        test_answers_att2["q_sql_05"] = 1 # SQL now 5/5

        res_sub2 = client.post("/api/v1/skill-assessment/submit", json={"answers": test_answers_att2}, headers=headers)
        assert res_sub2.status_code == 200
        res2_data = res_sub2.json()

        assert "SQL" in res2_data["strong_skills"]
        assert res2_data["proficiency_levels"]["SQL"] == "Expert"

        # Verify GET /me returns updated attempt 2
        res_me2 = client.get("/api/v1/skill-assessment/me", headers=headers)
        assert res_me2.status_code == 200
        assert "SQL" in res_me2.json()["strong_skills"]
        print("[OK] Retake Assessment verified: Updated result saved & fetched correctly!")

        print("\n==============================================")
        print("ALL PHASE 4 SKILL ASSESSMENT TESTS PASSED SUCCESSFULLY!")
        print("==============================================")

if __name__ == "__main__":
    run_phase4_verification_tests()
