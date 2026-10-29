import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

def test_data_enthusiast_recommendations():
    with TestClient(app) as client:
        import time
        unique_email = f"data_enthusiast_{int(time.time())}@example.com"
        res = client.post('/api/v1/auth/signup', json={
            'full_name': 'Data Enthusiast',
            'email': unique_email,
            'password': 'password123',
            'confirm_password': 'password123'
        })
        assert res.status_code == 201, f"Signup failed: {res.text}"
        token = res.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}

        # 2. Submit Discovery with 12 out of 12 Data (option 1)
        disc_answers = {f'cd_q{i:02d}': 1 for i in range(1, 13)}
        res_disc = client.post('/api/v1/discovery/submit', json={'answers': disc_answers}, headers=headers)
        assert res_disc.status_code == 200, f"Discovery submit failed: {res_disc.text}"
        percentages = res_disc.json()['result']['percentages']
        print('Discovery percentages:', percentages)
        assert percentages['data'] == 100.0, f"Expected 100% data, got {percentages['data']}"

        # 3. Get recommendations
        res_recs = client.get('/api/v1/recommendations', headers=headers)
        assert res_recs.status_code == 200, f"Recs failed: {res_recs.text}"
        recs = res_recs.json()['recommendations']
        
        print('\n=== Top Recommendations for 100% Data Interest ===')
        for i, r in enumerate(recs):
            print(f"{i+1}. {r['title']} - Suitability: {r['suitability_score']}%, Interest Match: {r['interest_match']}%, Assessment Pending: {r['is_assessment_pending']}")

        top_car = recs[0]
        # Data Scientist & ML Engineer should be #1 ranked
        assert "Data Scientist" in top_car['title'], f"Expected Data Scientist at #1, but got {top_car['title']}"
        assert top_car['interest_match'] >= 90.0, f"Expected interest match >= 90%, got {top_car['interest_match']}"
        assert top_car['is_assessment_pending'] is True, "Expected is_assessment_pending to be True"
        print("\n[SUCCESS] Data Scientist & ML Engineer is ranked #1 with 100% Data Interest!")

if __name__ == '__main__':
    test_data_enthusiast_recommendations()
