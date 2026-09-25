import asyncio
from fastapi.testclient import TestClient
from app.main import app

def run_phase3_verification_tests():
    with TestClient(app) as client:
        print("=== Starting Phase 3 Comprehensive Verification Suite ===")

        # 1. Test GET /api/v1/discovery/questions
        res_q = client.get("/api/v1/discovery/questions")
        assert res_q.status_code == 200, f"Discovery questions failed: {res_q.text}"
        q_data = res_q.json()
        assert q_data.get("success") is True
        assert "questions" in q_data and len(q_data["questions"]) == 12
        print(f"[OK] GET /api/v1/discovery/questions passed ({len(q_data['questions'])} questions returned)")

        # 2. Test Unauthenticated POST submission (Expect 401 Unauthorized)
        dummy_answers = {f"cd_q{i:02d}": 0 for i in range(1, 13)}
        res_unauth = client.post("/api/v1/discovery/submit", json={"answers": dummy_answers})
        assert res_unauth.status_code == 401
        print("[OK] Unauthenticated submission properly rejected (401 Unauthorized)")

        # 3. Create Authenticated Test User
        email = f"retake_user_{int(asyncio.get_event_loop().time()*1000)}@example.com"
        signup_payload = {
            "full_name": "Retake Candidate",
            "email": email,
            "password": "password123",
            "confirm_password": "password123"
        }
        res_auth = client.post("/api/v1/auth/signup", json=signup_payload)
        assert res_auth.status_code == 201
        token = res_auth.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"[OK] Test user created ({email})")

        # 4. First Attempt: Data & Analytics Heavy (4 Data, 3 Technical, 3 Business, 2 Design)
        attempt_1_answers = {
            "cd_q01": 1, "cd_q02": 1, "cd_q03": 1, "cd_q04": 1,  # Data (4)
            "cd_q05": 0, "cd_q06": 0, "cd_q07": 0,              # Technical (3)
            "cd_q08": 3, "cd_q09": 3, "cd_q10": 3,              # Business (3)
            "cd_q11": 2, "cd_q12": 2                          # Design (2)
        }
        res_att1 = client.post("/api/v1/discovery/submit", json={"answers": attempt_1_answers}, headers=headers)
        assert res_att1.status_code == 200
        res1_data = res_att1.json()["result"]
        assert res1_data["scores"]["data"] == 4
        assert res1_data["top_areas"][0]["area"] == "Data / Analytics"
        
        # Verify Percentage total 100%
        p1_total = sum(res1_data["percentages"].values())
        assert round(p1_total, 2) == 100.0, f"Attempt 1 percentages sum ({p1_total}) is not 100.0%"
        
        # Verify career mapping for Data
        car_titles_1 = [c["title"] for c in res1_data["relevant_careers"]]
        assert "Data Scientist & ML Engineer" in car_titles_1
        print(f"[OK] Attempt 1 submitted! Top Area: {res1_data['top_areas'][0]['area']}, Percentages Total: {p1_total:.2f}%")

        # Verify GET /discovery/me returns Attempt 1
        res_me_1 = client.get("/api/v1/discovery/me", headers=headers)
        assert res_me_1.status_code == 200
        assert res_me_1.json()["result"]["scores"]["data"] == 4
        print("[OK] GET /api/v1/discovery/me returns Attempt 1 correctly")

        # 5. RETAKE DISCOVERY: Second Attempt (5 Technical, 3 Business, 2 Data, 2 Design)
        # Tests case where rounding might produce 100.01% without adjustment (5/12=41.67, 3/12=25.0, 2/12=16.67, 2/12=16.67)
        attempt_2_answers = {
            "cd_q01": 0, "cd_q02": 0, "cd_q03": 0, "cd_q04": 0, "cd_q05": 0, # Technical (5)
            "cd_q06": 3, "cd_q07": 3, "cd_q08": 3,                          # Business (3)
            "cd_q09": 1, "cd_q10": 1,                                      # Data (2)
            "cd_q11": 2, "cd_q12": 2                                       # Design (2)
        }
        res_att2 = client.post("/api/v1/discovery/submit", json={"answers": attempt_2_answers}, headers=headers)
        assert res_att2.status_code == 200
        res2_data = res_att2.json()["result"]

        # Verify scores updated
        assert res2_data["scores"]["technical"] == 5
        assert res2_data["scores"]["data"] == 2
        assert res2_data["top_areas"][0]["area"] == "Technical / Software"

        # Verify Percentages total EXACTLY 100.0%
        p2_total = sum(res2_data["percentages"].values())
        assert round(p2_total, 2) == 100.0, f"Attempt 2 percentages sum ({p2_total}) is not 100.0%"

        # Verify relevant careers updated to Technical
        car_titles_2 = [c["title"] for c in res2_data["relevant_careers"]]
        assert "Full Stack Software Engineer" in car_titles_2 or "DevOps & Cloud Engineer" in car_titles_2
        print(f"[OK] Retake Discovery submitted! Top Area updated to: {res2_data['top_areas'][0]['area']}, Percentages Total: {p2_total:.2f}%")

        # 6. Verify GET /discovery/me returns Attempt 2 (Replacing previous result, no duplicate records)
        res_me_2 = client.get("/api/v1/discovery/me", headers=headers)
        assert res_me_2.status_code == 200
        me_2_res = res_me_2.json()["result"]
        assert me_2_res["scores"]["technical"] == 5
        assert me_2_res["scores"]["data"] == 2
        print("[OK] GET /api/v1/discovery/me verified: Returns updated Attempt 2 cleanly!")

        print("\n==============================================")
        print("ALL RETAKE & VERIFICATION TESTS PASSED SUCCESSFULLY!")
        print("==============================================")

if __name__ == "__main__":
    run_phase3_verification_tests()
