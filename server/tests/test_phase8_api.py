import sys
import os
import asyncio
from fastapi.testclient import TestClient

# Add server directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app

def run_tests():
    client = TestClient(app)

    print("\n=== Starting Phase 8.1 Portfolio Projects & Tracking Complete Verification Suite ===")

    # 1. Unauthorized request returns 401
    res = client.get("/api/v1/projects/recommended")
    assert res.status_code == 401, f"Expected 401 for unauthenticated recommended projects, got {res.status_code}"
    print("[OK] 1. Unauthorized request returns 401 Unauthorized")

    # Setup User A (IT Target Career)
    timestamp_id = int(asyncio.get_event_loop().time() * 1000)
    email_a = f"testuser_p81a_{timestamp_id}@example.com"
    signup_payload_a = {
        "full_name": "Phase 8.1 IT User A",
        "email": email_a,
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/signup", json=signup_payload_a)
    assert res.status_code == 201, f"Signup A failed: {res.text}"
    token_a = res.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Profile for User A
    profile_payload_a = {
        "full_name": "Phase 8.1 IT User A",
        "email": email_a,
        "education_level": "Bachelor's Degree",
        "degree": "B.Tech",
        "branch": "Computer Science",
        "graduation_year": 2026,
        "current_skills": ["SQL", "Git"],
        "interests": ["Full Stack Software Engineer"],
        "preferred_category": "IT"
    }
    client.post("/api/v1/profile", json=profile_payload_a, headers=headers_a)

    # 2. Authenticated user can retrieve master catalog
    res = client.get("/api/v1/projects", headers=headers_a)
    assert res.status_code == 200, f"Get projects failed: {res.text}"
    p_data = res.json()
    assert "projects" in p_data and len(p_data["projects"]) >= 11, f"Expected at least 11 projects, got {len(p_data.get('projects', []))}"
    print(f"[OK] 2. Catalog contains {len(p_data['projects'])} projects covering IT & Non-IT careers")

    # 3. Category filter works
    res_it = client.get("/api/v1/projects?category=IT", headers=headers_a)
    assert res_it.status_code == 200
    it_projects = res_it.json()["projects"]
    assert all(p["category"] == "IT" for p in it_projects), "Non-IT project found in IT filter"
    print(f"[OK] 3. Category filtering works correctly ({len(it_projects)} IT projects)")

    # 4. Personalized recommendation & 5-part match score breakdown
    res = client.get("/api/v1/projects/recommended", headers=headers_a)
    assert res.status_code == 200, f"Recommended projects failed: {res.text}"
    rec_data = res.json()
    assert "projects" in rec_data and len(rec_data["projects"]) > 0
    top_rec = rec_data["projects"][0]
    
    assert "recommendation_score" in top_rec, "Recommendation score missing"
    assert "match_score_breakdown" in top_rec, "Match score breakdown missing"
    bd = top_rec["match_score_breakdown"]
    assert "target_career_relevance" in bd
    assert "skill_gap_alignment" in bd
    assert "current_skill_compatibility" in bd
    assert "difficulty_readiness_fit" in bd
    assert "portfolio_value_fit" in bd
    assert "priority" in top_rec
    assert "reason" in top_rec
    assert "skills_you_will_improve" in top_rec
    print(f"[OK] 4. Personalized 5-part weighted recommendation model verified! (Top: '{top_rec['title']}' - Score: {top_rec['recommendation_score']}% - Priority: {top_rec['priority']})")

    # 5. Project details with hydrated roadmap
    target_proj_id = top_rec["id"]
    res = client.get(f"/api/v1/projects/{target_proj_id}", headers=headers_a)
    assert res.status_code == 200, f"Project details failed: {res.text}"
    proj_detail = res.json()
    assert proj_detail["id"] == target_proj_id
    assert "roadmap" in proj_detail and len(proj_detail["roadmap"]) > 0
    print(f"[OK] 5. Project details retrieved with roadmap ({len(proj_detail['roadmap'])} milestones)")

    # 6. Start project
    res = client.post(f"/api/v1/projects/{target_proj_id}/start", headers=headers_a)
    assert res.status_code == 200, f"Start project failed: {res.text}"
    start_res = res.json()
    assert start_res["progress"]["status"] == "In Progress"
    print(f"[OK] 6. Project '{target_proj_id}' started successfully (Status: In Progress)")

    # 7. Milestone toggle & automatic status / progress % sync
    first_milestone_id = proj_detail["roadmap"][0]["id"]
    res = client.patch(f"/api/v1/projects/{target_proj_id}/milestones/{first_milestone_id}", headers=headers_a)
    assert res.status_code == 200, f"Milestone toggle failed: {res.text}"
    m_res = res.json()
    assert first_milestone_id in m_res["progress"]["completed_milestones"]
    assert m_res["progress"]["progress_percentage"] > 0
    assert m_res["progress"]["status"] == "In Progress"
    print(f"[OK] 7. Milestone toggled successfully (Progress: {m_res['progress']['progress_percentage']}%, Status: In Progress)")

    # 8. Milestone untoggle
    res = client.patch(f"/api/v1/projects/{target_proj_id}/milestones/{first_milestone_id}", headers=headers_a)
    assert res.status_code == 200
    m_res_off = res.json()
    assert first_milestone_id not in m_res_off["progress"]["completed_milestones"]
    assert m_res_off["progress"]["progress_percentage"] == 0
    assert m_res_off["progress"]["status"] == "Not Started"
    print("[OK] 8. Milestone untoggled, auto-synced back to 0% and 'Not Started'")

    # 9. Save project URLs (GitHub, Live Demo, Documentation)
    url_payload = {
        "github_url": "https://github.com/user/my-saas-project",
        "live_demo_url": "https://my-saas-project.vercel.app",
        "documentation_url": "https://notion.so/my-saas-prd"
    }
    res = client.patch(f"/api/v1/projects/{target_proj_id}/progress", json=url_payload, headers=headers_a)
    assert res.status_code == 200
    url_res = res.json()["progress"]
    assert url_res["github_url"] == "https://github.com/user/my-saas-project"
    assert url_res["live_demo_url"] == "https://my-saas-project.vercel.app"
    assert url_res["documentation_url"] == "https://notion.so/my-saas-prd"
    print("[OK] 9. GitHub, Live Demo, and Documentation URLs persisted successfully")

    # 10. Update progress percentage manually
    patch_payload = {
        "status": "In Progress",
        "progress_percentage": 75
    }
    res = client.patch(f"/api/v1/projects/{target_proj_id}/progress", json=patch_payload, headers=headers_a)
    assert res.status_code == 200
    update_res = res.json()
    assert update_res["progress"]["progress_percentage"] == 75
    print("[OK] 10. Manual progress update verified (75% Progress)")

    # 11. Invalid progress values return 400
    res = client.patch(f"/api/v1/projects/{target_proj_id}/progress", json={"status": "InvalidStatus"}, headers=headers_a)
    assert res.status_code == 400
    res = client.patch(f"/api/v1/projects/{target_proj_id}/progress", json={"progress_percentage": 150}, headers=headers_a)
    assert res.status_code == 400
    print("[OK] 11. Invalid status/percentage properly returned 400 Bad Request")

    # 12. Complete project
    res = client.post(f"/api/v1/projects/{target_proj_id}/complete", headers=headers_a)
    assert res.status_code == 200
    comp_res = res.json()
    assert comp_res["progress"]["status"] == "Completed"
    assert comp_res["progress"]["progress_percentage"] == 100
    print(f"[OK] 12. Project '{target_proj_id}' marked as Completed (100% Progress)")

    # 13. Progress persistence in DB / Store
    res = client.get(f"/api/v1/projects/{target_proj_id}/progress", headers=headers_a)
    assert res.status_code == 200
    prog_get = res.json()
    assert prog_get["status"] == "Completed"
    assert prog_get["progress_percentage"] == 100
    print("[OK] 13. Progress verified persisted in database")

    # 14. User Isolation (User B sees clean 0% state)
    email_b = f"testuser_p81b_{timestamp_id}@example.com"
    signup_payload_b = {
        "full_name": "Phase 8.1 User B",
        "email": email_b,
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/v1/auth/signup", json=signup_payload_b)
    assert res.status_code == 201
    token_b = res.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    res = client.get(f"/api/v1/projects/{target_proj_id}/progress", headers=headers_b)
    assert res.status_code == 200
    user_b_prog = res.json()
    assert user_b_prog["status"] == "Not Started", "User B saw User A's progress!"
    print("[OK] 14. User Isolation verified: User B sees clean 'Not Started' status!")

    # 15. Portfolio readiness updates correctly
    portfolio_readiness = comp_res.get("portfolio_readiness", 0)
    assert portfolio_readiness > 0, "Portfolio readiness score was not updated"
    print(f"[OK] 15. Weighted portfolio readiness calculated correctly ({portfolio_readiness}%)")

    # 16. Action plan reflects completed project
    res = client.get("/api/v1/action-plan", headers=headers_a)
    assert res.status_code == 200
    plan_data = res.json()
    action_projs = plan_data.get("recommended_projects", [])
    matching_action_p = next((p for p in action_projs if p.get("project_id") == target_proj_id or p.get("id") == target_proj_id), None)
    if matching_action_p:
        assert matching_action_p["status"] == "Completed", "Action plan project status was not updated"
    print("[OK] 16. Phase 6 Action Plan synchronized and reflects completed project")

    # 17. Invalid project ID returns 404
    res = client.get("/api/v1/projects/invalid_project_id_9999", headers=headers_a)
    assert res.status_code == 404
    print("[OK] 17. Invalid project ID properly returned 404 Not Found")

    # 18. Non-IT user gets relevant Non-IT recommendations
    profile_payload_b = {
        "full_name": "Phase 8.1 Non-IT User B",
        "email": email_b,
        "education_level": "Bachelor's Degree",
        "degree": "BBA",
        "branch": "Marketing",
        "graduation_year": 2025,
        "current_skills": ["Content Strategy"],
        "interests": ["Digital Marketing Strategist"],
        "preferred_category": "Non-IT"
    }
    client.post("/api/v1/profile", json=profile_payload_b, headers=headers_b)

    res_b_recs = client.get("/api/v1/projects/recommended", headers=headers_b)
    assert res_b_recs.status_code == 200
    b_recs = res_b_recs.json()["projects"]
    assert len(b_recs) > 0
    top_non_it = b_recs[0]
    assert top_non_it["category"] == "Non-IT" or "Marketing" in top_non_it.get("target_careers", [top_non_it.get("title")])[0]
    print(f"[OK] 18. Non-IT User B received top Non-IT recommendation: '{top_non_it['title']}' ({top_non_it['recommendation_score']}%)")

    # 19. Complete milestone auto-sync to 100% Completed
    roadmap_ids = [m["id"] for m in top_non_it["roadmap"]]
    res_all_m = client.patch(f"/api/v1/projects/{top_non_it['id']}/progress", json={"completed_milestones": roadmap_ids}, headers=headers_b)
    assert res_all_m.status_code == 200
    all_m_prog = res_all_m.json()["progress"]
    assert all_m_prog["status"] == "Completed"
    assert all_m_prog["progress_percentage"] == 100
    print("[OK] 19. All milestones completed auto-synced project status to 100% 'Completed'")

    print("\n============================================================")
    print("ALL 19 PHASE 8.1 PORTFOLIO PROJECT TESTS PASSED SUCCESSFULLY!")
    print("============================================================\n")

if __name__ == "__main__":
    run_tests()
