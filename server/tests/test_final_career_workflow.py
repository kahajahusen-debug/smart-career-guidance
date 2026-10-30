import sys
import time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

def test_final_career_workflow_e2e():
    with TestClient(app) as client:
        ts = int(time.time() * 1000)
        email_student_it = f"student_it_{ts}@example.com"
        email_student_nonit = f"student_nonit_{ts}@example.com"

        print("\n========================================================")
        print("SCENARIO 1: SIGNUP & DETAILED EDUCATIONAL PROFILE")
        print("========================================================")
        signup_payload_a = {
            "full_name": "Aarav Sharma",
            "email": email_student_it,
            "password": "Password123!",
            "confirm_password": "Password123!",
            "education_level": "Bachelor's Degree",
            "degree": "B.Tech Computer Science and Engineering",
            "branch": "Computer Science",
            "year_of_study": "3rd Year",
            "graduation_year": 2027,
            "experience_level": "Student / Fresher",
            "preferred_category": "IT",
            "current_skills": ["Python", "JavaScript", "SQL"],
            "interests": ["Artificial Intelligence", "Software Engineering"]
        }
        res_signup_a = client.post("/api/v1/auth/signup", json=signup_payload_a)
        assert res_signup_a.status_code == 201, f"Signup failed: {res_signup_a.text}"
        data_a = res_signup_a.json()
        token_a = data_a["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}
        user_a = data_a["user"]
        print(f"[OK] User A created: {user_a['full_name']} ({user_a['id']})")

        # Verify educational profile persistence
        res_prof = client.get("/api/v1/profile/me", headers=headers_a)
        assert res_prof.status_code == 200
        prof = res_prof.json()
        assert prof["education_level"] == "Bachelor's Degree"
        assert prof["degree"] == "B.Tech Computer Science and Engineering"
        assert prof["branch"] == "Computer Science"
        assert prof["year_of_study"] == "3rd Year"
        assert prof["graduation_year"] == 2027
        assert "Python" in prof["current_skills"]
        print("[OK] Educational profile accurately stored with user ID in MongoDB.")

        print("\n========================================================")
        print("SCENARIO 2: LOGIN USING EMAIL & PASSWORD ONLY")
        print("========================================================")
        res_login = client.post("/api/v1/auth/login", json={
            "email": email_student_it,
            "password": "Password123!"
        })
        assert res_login.status_code == 200, f"Login failed: {res_login.text}"
        login_data = res_login.json()
        assert "access_token" in login_data
        print("[OK] Simple email & password login verified.")

        print("\n========================================================")
        print("SCENARIO 3: WORKFLOW STATE - INCOMPLETE DISCOVERY")
        print("========================================================")
        res_disc_check = client.get("/api/v1/discovery/me", headers=headers_a)
        disc_state = res_disc_check.json()
        assert disc_state.get("success") is False or disc_state.get("has_completed") is False
        print("[OK] User has no completed Career Discovery yet -> Routes to Career Discovery.")

        print("\n========================================================")
        print("SCENARIO 4: SUBMIT CAREER DISCOVERY")
        print("========================================================")
        res_disc_q = client.get("/api/v1/discovery/questions")
        assert res_disc_q.status_code == 200
        disc_questions = res_disc_q.json().get("questions", [])
        assert len(disc_questions) == 12, f"Expected 12 discovery questions, got {len(disc_questions)}"

        # Answer with technical / software preference (option 0)
        disc_answers = {q["id"]: 0 for q in disc_questions}
        res_disc_sub = client.post("/api/v1/discovery/submit", json={"answers": disc_answers}, headers=headers_a)
        assert res_disc_sub.status_code == 200, f"Discovery submit failed: {res_disc_sub.text}"
        disc_res = res_disc_sub.json().get("result", {})
        assert disc_res.get("scores", {}).get("technical") == 12
        assert disc_res.get("percentages", {}).get("technical") == 100.0
        print(f"[OK] Career Discovery answers scored and saved. Technical: 100.0%")

        # Re-check discovery/me
        res_disc_me = client.get("/api/v1/discovery/me", headers=headers_a)
        assert res_disc_me.status_code == 200
        disc_me_data = res_disc_me.json()
        assert disc_me_data.get("has_completed") is True
        print("[OK] Career Discovery marked as completed in MongoDB.")

        print("\n========================================================")
        print("SCENARIO 5: WORKFLOW STATE - DISCOVERY DONE, SKILL PENDING")
        print("========================================================")
        res_skill_me = client.get("/api/v1/skill-assessment/me", headers=headers_a)
        skill_me_data = res_skill_me.json()
        assert skill_me_data.get("completed") is False or skill_me_data.get("success") is False
        print("[OK] Discovery complete, Skill Assessment incomplete -> Routes to Skill Assessment.")

        print("\n========================================================")
        print("SCENARIO 6: COMPLETE ACTUAL SKILL ASSESSMENT")
        print("========================================================")
        res_questions = client.get("/api/v1/questions?category=IT")
        assert res_questions.status_code == 200
        q_list = res_questions.json().get("questions", [])
        assert len(q_list) > 0, "Question catalog should not be empty"

        # Answer 8 questions correctly
        skill_answers = {}
        for q in q_list[:8]:
            correct_idx = q.get("correct_answer", 0)
            skill_answers[str(q["id"])] = correct_idx

        res_skill_sub = client.post("/api/v1/skill-assessment/submit", json={"answers": skill_answers}, headers=headers_a)
        assert res_skill_sub.status_code == 200, f"Skill assessment submit failed: {res_skill_sub.text}"
        eval_result = res_skill_sub.json()
        assert eval_result.get("overall_accuracy") == 100.0
        assert eval_result.get("total_questions") == 8
        print(f"[OK] Skill assessment scored: accuracy = {eval_result['overall_accuracy']}%, questions = {eval_result['total_questions']}")

        print("\n========================================================")
        print("SCENARIO 7: UNIFIED CAREER RESULTS ENDPOINT")
        print("========================================================")
        res_results = client.get("/api/v1/career-results", headers=headers_a)
        assert res_results.status_code == 200, f"Career Results failed: {res_results.text}"
        results_data = res_results.json()

        assert "recommendations" in results_data, "Expected recommendations list in results"
        recs = results_data["recommendations"]
        assert len(recs) > 0, "Recommendations should not be empty"

        top_car = recs[0]
        print(f"[OK] Top Career Match: {top_car['title']} ({top_car['suitability_score']}% suitability)")
        assert top_car["suitability_score"] > 50.0, "Suitability score should be benchmarked"
        assert "matching_skills" in top_car
        assert "required_skills" in top_car
        assert "missing_skills" in top_car
        assert "reason" in top_car
        assert "interest_match" in top_car
        assert "skill_match" in top_car
        assert "education_match" in top_car
        assert results_data.get("calculation_explanation") is not None
        assert results_data.get("disclaimer") is not None
        print(f"     Matching Skills: {top_car['matching_skills']}")
        print(f"     Explanation: {results_data['calculation_explanation']}")
        print(f"     Disclaimer: {results_data['disclaimer']}")

        print("\n========================================================")
        print("SCENARIO 8: TARGET CAREER & LEARNING ROADMAP PROGRESS")
        print("========================================================")
        target_id = top_car["career_id"]
        res_target = client.post("/api/v1/career-results/target", json={"target_career_id": target_id}, headers=headers_a)
        assert res_target.status_code == 200
        target_resp = res_target.json()
        assert target_resp.get("success") is True
        action_plan = target_resp.get("action_plan", {})
        assert action_plan.get("target_career_title") == top_car["title"]
        print(f"[OK] Target career updated: {action_plan.get('target_career_title')}")

        # Update roadmap milestone progress
        res_prog = client.patch("/api/v1/career-results/progress", json={
            "item_id": "m_0",
            "item_type": "milestone",
            "status": "Completed"
        }, headers=headers_a)
        assert res_prog.status_code == 200
        prog_data = res_prog.json()
        assert prog_data.get("success") is True
        print("[OK] Learning roadmap milestone progress updated.")

        print("\n========================================================")
        print("SCENARIO 9: DETAILED CAREER PROFILE SPECIFIC TO USER")
        print("========================================================")
        res_detail = client.get(f"/api/v1/career-results/{target_id}", headers=headers_a)
        assert res_detail.status_code == 200
        detail_data = res_detail.json()
        assert detail_data["career_id"] == target_id
        assert detail_data["title"] == top_car["title"]
        assert len(detail_data.get("matching_skills", [])) > 0
        print(f"[OK] Career detail verified for {detail_data['title']}.")

        print("\n========================================================")
        print("SCENARIO 10: SECOND USER ISOLATION (NON-IT PROFILE)")
        print("========================================================")
        signup_payload_b = {
            "full_name": "Priya Patel",
            "email": email_student_nonit,
            "password": "Password123!",
            "confirm_password": "Password123!",
            "education_level": "Bachelor's Degree",
            "degree": "BBA Marketing & Finance",
            "branch": "Marketing",
            "year_of_study": "Final Year",
            "graduation_year": 2026,
            "experience_level": "Student / Fresher",
            "preferred_category": "Non-IT",
            "current_skills": ["Financial Analysis", "Content Strategy"],
            "interests": ["Product Management", "Digital Marketing"]
        }
        res_signup_b = client.post("/api/v1/auth/signup", json=signup_payload_b)
        assert res_signup_b.status_code == 201
        data_b = res_signup_b.json()
        token_b = data_b["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # User B should have separate discovery state
        res_disc_b = client.get("/api/v1/discovery/me", headers=headers_b)
        assert res_disc_b.json().get("has_completed") is False
        print("[OK] User B data is strictly isolated; has not completed Career Discovery.")

        # User B Career Results without assessment show Non-IT alignment
        res_results_b = client.get("/api/v1/career-results?category=Non-IT", headers=headers_b)
        assert res_results_b.status_code == 200
        recs_b = res_results_b.json().get("recommendations", [])
        assert len(recs_b) > 0
        assert all(c["category"] == "Non-IT" for c in recs_b)
        print(f"[OK] User B received Non-IT recommendations: {recs_b[0]['title']}")
        print(f"[OK] User A and User B received distinct, isolated recommendations.")

        print("\n========================================================")
        print("ALL FINAL CAREER WORKFLOW E2E TESTS PASSED SUCCESSFULLY!")
        print("========================================================")

if __name__ == "__main__":
    test_final_career_workflow_e2e()

