import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Orbital Calculation Engine is running"}

def test_predict_position_valid():
    request_data = {
        "tle": {
            "line1": "1 25544U 98067A   25214.50905606  .00016717  00000-0  33416-4 0  9990",
            "line2": "2 25544  51.6416 251.3426 0006703 130.5360 325.0160 15.49324113  8947"
        },
        "predict_at_utc": "2025-08-02T12:00:00Z"
    }
    response = client.post("/predict", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert "requested_time_utc" in data
    assert "position_eci_km" in data
    assert "velocity_eci_km_s" in data
    assert "x" in data["position_eci_km"]
    assert "y" in data["position_eci_km"]
    assert "z" in data["position_eci_km"]

def test_predict_position_invalid_tle():
    request_data = {
        "tle": {
            "line1": "1 25544U 98067A   25214.50905606  .00016717  00000-0  33416-4 0  9990",
            "line2": "2 25544  51.6416 251.3426 0006703 130.5360 325.0160 15.49324113" # Invalid line 2
        },
        "predict_at_utc": "2025-08-02T12:00:00Z"
    }
    response = client.post("/predict", json=request_data)
    assert response.status_code == 400

def test_predict_position_invalid_time():
    request_data = {
        "tle": {
            "line1": "1 25544U 98067A   25214.50905606  .00016717  00000-0  33416-4 0  9990",
            "line2": "2 25544  51.6416 251.3426 0006703 130.5360 325.0160 15.49324113  8947"
        },
        "predict_at_utc": "invalid-time"
    }
    response = client.post("/predict", json=request_data)
    assert response.status_code == 400
