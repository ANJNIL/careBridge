from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    print("Health check response:", response.status_code, response.json())
    assert response.status_code == 200

def test_triage_v1():
    payload = {
        "transcribed_text": "Chhaati me bohot tez dard ho raha hai aur behosh ho gaya hai"
    }
    response = client.post("/api/v1/agent/triage", json=payload)
    print("\n[V1 Endpoint Response]:", response.status_code)
    data = response.json()
    print("Urgency:", data["urgency_level"])
    print("Specialty:", data["specialty"])
    print("Hospitals:", len(data["hospitals"]))
    assert response.status_code == 200
    assert data["urgency_level"] == "Critical"

def test_triage_react_alias():
    # React format uses inputText
    payload = {
        "inputText": "Severe motor vehicle accident with compound fracture and arterial bleed",
        "languageCode": "en"
    }
    response = client.post("/api/triage", json=payload)
    print("\n[React Alias Endpoint Response]:", response.status_code)
    data = response.json()
    print("Triage Level:", data["triageLevel"])
    print("Triage Category:", data["triageCategory"])
    print("Specialty:", data["specialty"])
    print("SBAR Situation:", data["sbar"]["situation"][:50], "...")
    assert response.status_code == 200
    assert data["triageLevel"] == 1
    assert data["specialty"] == "Trauma"

if __name__ == "__main__":
    test_health()
    test_triage_v1()
    test_triage_react_alias()
    print("\n>>> ALL BACKEND ENDPOINTS & REACT COMPATIBILITY VERIFIED! <<<")
