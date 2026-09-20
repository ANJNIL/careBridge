"""Test FastAPI endpoint using starlette TestClient."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    print("Health check response:", response.status_code, response.json())
    assert response.status_code == 200

def test_triage_api():
    payload = {
        "transcribed_text": "Chhaati me bohot tez dard ho raha hai aur behosh ho gaya hai"
    }
    response = client.post("/api/v1/agent/triage", json=payload)
    print("\nAPI Response status:", response.status_code)
    data = response.json()
    print("Urgency:", data["urgency_level"])
    print("Specialty:", data["specialty"])
    print("Hospitals:", len(data["hospitals"]))
    print("SBAR:\n", data["sbar_handover"])
    assert response.status_code == 200
    assert data["urgency_level"] == "Critical"

if __name__ == "__main__":
    test_health()
    test_triage_api()
    print("\n>>> FASTAPI ENDPOINTS VERIFIED AND OPERATIONAL! <<<")
