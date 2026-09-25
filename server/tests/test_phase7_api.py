import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
from fastapi.testclient import TestClient
from app.main import app

def run_phase7_verification_tests():
    with TestClient(app) as client:
        print("=== Starting Phase 7 Job Recommendations & Application Tracking Verification Suite ===")

        # 1. GET recommended jobs without JWT -> 401
        res_unauth = client.get("/api/v1/jobs/recommended")
        assert res_unauth.status_code == 401
        print("[OK] 1. GET /api/v1/jobs/recommended without JWT properly rejected (401 Unauthorized)")

        # Create Candidate User A
        timestamp_id = int(asyncio.get_event_loop().time()*1000)
        email_a = f"job_user_a_{timestamp_id}@example.com"
        res_auth_a = client.post("/api/v1/auth/signup", json={
            "full_name": "Job Candidate A",
            "email": email_a,
            "password": "password123",
            "confirm_password": "password123"
        })
        assert res_auth_a.status_code == 201
        token_a = res_auth_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Setup Profile & Assessment for Candidate A (IT CS focus)
        client.post("/api/v1/profile", json={
            "full_name": "Job Candidate A",
            "email": email_a,
            "education_level": "Bachelor's Degree",
            "degree": "B.Tech Computer Science",
            "current_skills": ["Python", "SQL", "JavaScript", "React"],
            "interests": ["Machine Learning", "Web Development"],
            "preferred_category": "IT"
        }, headers=headers_a)

        client.post("/api/v1/skill-assessment/submit", json={
            "answers": {"q_py_01": 1, "q_py_02": 2, "q_py_03": 1, "q_sql_01": 2, "q_ml_01": 1}
        }, headers=headers_a)

        # 2. GET recommended jobs with JWT -> 200
        res_rec_a = client.get("/api/v1/jobs/recommended", headers=headers_a)
        assert res_rec_a.status_code == 200
        rec_data = res_rec_a.json()
        assert "jobs" in rec_data and len(rec_data["jobs"]) > 0
        jobs_a = rec_data["jobs"]
        print(f"[OK] 2. GET /api/v1/jobs/recommended with JWT passed ({len(jobs_a)} jobs returned)")

        # 3. Job Search test
        res_search = client.get("/api/v1/jobs/recommended?search=Data", headers=headers_a)
        assert res_search.status_code == 200
        search_jobs = res_search.json()["jobs"]
        assert all("data" in j["title"].lower() or "data" in j["company"].lower() or "data" in j["description"].lower() or any("data" in s.lower() for s in j.get("required_skills", [])) for j in search_jobs)
        print(f"[OK] 3. Job Search ('Data') passed ({len(search_jobs)} matching jobs found)")

        # 4. Category Filtering (IT only)
        res_cat_it = client.get("/api/v1/jobs/recommended?category=IT", headers=headers_a)
        assert res_cat_it.status_code == 200
        it_jobs = res_cat_it.json()["jobs"]
        assert all(j["category"] == "IT" for j in it_jobs)
        print(f"[OK] 4. Category Filtering (IT) passed ({len(it_jobs)} IT jobs returned)")

        # 5. Internship Filtering (is_internship=true)
        res_intern = client.get("/api/v1/jobs/recommended?is_internship=true", headers=headers_a)
        assert res_intern.status_code == 200
        internships = res_intern.json()["jobs"]
        assert all(j.get("is_internship") is True or j.get("employment_type") == "Internship" for j in internships)
        print(f"[OK] 5. Internship Filtering passed ({len(internships)} internships returned)")

        # 6. Job Detail
        target_job = jobs_a[0]
        target_job_id = target_job["job_id"]
        res_detail = client.get(f"/api/v1/jobs/{target_job_id}", headers=headers_a)
        assert res_detail.status_code == 200
        detail_data = res_detail.json()
        assert detail_data["job_id"] == target_job_id
        print(f"[OK] 6. Job Detail endpoint passed for '{detail_data['title']}'")

        # 7. Job Match Calculation
        assert "match_score" in detail_data
        assert 0 <= detail_data["match_score"] <= 100
        assert "matching_skills" in detail_data
        assert "missing_skills" in detail_data
        assert "why_this_job_matches" in detail_data
        print(f"[OK] 7. Job Match calculation verified: Score {detail_data['match_score']}%, Match explanation present")

        # 8. Invalid Job ID -> 404
        res_inv_job = client.get("/api/v1/jobs/non_existent_job_id_999", headers=headers_a)
        assert res_inv_job.status_code == 404
        print("[OK] 8. Invalid job ID properly returned 404 Not Found")

        # 9. Save Job
        res_save = client.post(f"/api/v1/jobs/{target_job_id}/save", headers=headers_a)
        assert res_save.status_code == 200
        print(f"[OK] 9. Job '{target_job_id}' saved successfully")

        # 10. Duplicate Save Prevention
        res_save_dup = client.post(f"/api/v1/jobs/{target_job_id}/save", headers=headers_a)
        assert res_save_dup.status_code == 200
        print(f"[OK] 10. Duplicate save handled gracefully without error")

        # 11. Saved Jobs Retrieval
        res_saved = client.get("/api/v1/jobs/saved", headers=headers_a)
        assert res_saved.status_code == 200
        saved_list = res_saved.json()["jobs"]
        assert any(j["job_id"] == target_job_id for j in saved_list)
        print(f"[OK] 11. Saved jobs retrieval verified: {len(saved_list)} saved job(s)")

        # 12. Unsave Job
        res_unsave = client.delete(f"/api/v1/jobs/{target_job_id}/save", headers=headers_a)
        assert res_unsave.status_code == 200
        res_saved_after = client.get("/api/v1/jobs/saved", headers=headers_a)
        assert not any(j["job_id"] == target_job_id for j in res_saved_after.json()["jobs"])
        print(f"[OK] 12. Unsave job verified: '{target_job_id}' successfully removed")

        # Re-save job for application creation
        client.post(f"/api/v1/jobs/{target_job_id}/save", headers=headers_a)

        # 13. Create Application
        res_app_create = client.post("/api/v1/applications", json={
            "job_id": target_job_id,
            "status": "Saved",
            "notes": "Interested in full-stack architecture role."
        }, headers=headers_a)
        assert res_app_create.status_code == 201
        app_data = res_app_create.json()
        app_id = app_data["application_id"]
        assert app_data["job_id"] == target_job_id
        assert app_data["status"] == "Saved"
        print(f"[OK] 13. Application created successfully (ID: {app_id})")

        # 14. Retrieve Applications
        res_apps_get = client.get("/api/v1/applications", headers=headers_a)
        assert res_apps_get.status_code == 200
        apps_list = res_apps_get.json()["applications"]
        assert any(a["application_id"] == app_id for a in apps_list)
        print(f"[OK] 14. Applications retrieval passed ({len(apps_list)} application(s))")

        # 15. Update Application Status
        res_app_update = client.patch(f"/api/v1/applications/{app_id}", json={
            "status": "Applied",
            "notes": "Applied via LinkedIn job portal."
        }, headers=headers_a)
        assert res_app_update.status_code == 200
        assert res_app_update.json()["status"] == "Applied"
        assert res_app_update.json()["applied_at"] is not None
        print(f"[OK] 15. Application status update passed: Saved -> Applied (Applied At set)")

        # 16. Invalid Application Status -> 400
        res_bad_status = client.patch(f"/api/v1/applications/{app_id}", json={
            "status": "INVALID_STATUS_XYZ"
        }, headers=headers_a)
        assert res_bad_status.status_code == 400
        print("[OK] 16. Invalid status transition properly returned 400 Bad Request")

        # 17. Application Statistics
        res_stats = client.get("/api/v1/applications/stats", headers=headers_a)
        assert res_stats.status_code == 200
        stats = res_stats.json()
        assert stats["total"] >= 1
        assert stats["applied"] >= 1
        assert "progress_percentages" in stats
        print(f"[OK] 17. Application stats verified: Total={stats['total']}, Applied={stats['applied']}")

        # Create Candidate User B (for user isolation testing)
        email_b = f"job_user_b_{timestamp_id}@example.com"
        res_auth_b = client.post("/api/v1/auth/signup", json={
            "full_name": "Job Candidate B",
            "email": email_b,
            "password": "password123",
            "confirm_password": "password123"
        })
        token_b = res_auth_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # 18. User Isolation Test
        res_apps_b = client.get("/api/v1/applications", headers=headers_b)
        assert res_apps_b.status_code == 200
        b_apps = res_apps_b.json()["applications"]
        assert not any(a["application_id"] == app_id for a in b_apps)
        print("[OK] 18. User Isolation verified: User B cannot see User A's applications")

        # 19. Unauthorized Application Access -> 404 / 401
        res_unauth_app = client.get(f"/api/v1/applications/{app_id}")
        assert res_unauth_app.status_code == 401

        res_cross_app = client.get(f"/api/v1/applications/{app_id}", headers=headers_b)
        assert res_cross_app.status_code == 404
        print("[OK] 19. Unauthorized cross-user application access returned 404 Not Found")

        # 20. Delete Application
        res_del = client.delete(f"/api/v1/applications/{app_id}", headers=headers_a)
        assert res_del.status_code == 200
        res_get_del = client.get(f"/api/v1/applications/{app_id}", headers=headers_a)
        assert res_get_del.status_code == 404
        print(f"[OK] 20. Application '{app_id}' deleted successfully")

        # 21. External URL availability
        assert "external_url" in target_job and target_job["external_url"].startswith("http")
        print(f"[OK] 21. External URL availability verified ('{target_job['external_url']}')")

        # 22. Recommendation integration with Phase 5
        res_phase5_rec = client.get("/api/v1/recommendations", headers=headers_a)
        assert res_phase5_rec.status_code == 200
        print("[OK] 22. Phase 5 Recommendations integration fully active and returning 200")

        # 23. Action Plan integration with Phase 6
        res_phase6_plan = client.get("/api/v1/action-plan", headers=headers_a)
        assert res_phase6_plan.status_code == 200
        print("[OK] 23. Phase 6 Action Plan integration fully active and returning 200")

        print("\n==============================================")
        print("ALL PHASE 7 JOB RECOMMENDATION & APPLICATION TRACKING TESTS PASSED SUCCESSFULLY!")
        print("==============================================")

if __name__ == "__main__":
    run_phase7_verification_tests()
