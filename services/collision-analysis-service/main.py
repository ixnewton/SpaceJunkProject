import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import httpx
import numpy as np
from datetime import datetime, timedelta

app = FastAPI()

ORBITAL_ENGINE_URL = "http://localhost:8005/predict"

class TLE(BaseModel):
    name: str
    line1: str
    line2: str

class ConjunctionRequest(BaseModel):
    tle1: TLE
    tle2: TLE

@app.get("/")
def read_root():
    return {"message": "Collision Analysis Service is running"}

async def get_prediction(client, tle, time_utc):
    try:
        response = await client.post(ORBITAL_ENGINE_URL, json={
            "tle": tle.dict(),
            "predict_at_utc": time_utc
        })
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Error from orbital engine: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error contacting orbital engine: {str(e)}")

async def send_collision_alert(tle1, tle2, result):
    notification_service_url = "http://localhost:8004/send-alert"
    alert_data = {
        "to": "admin@spacejunktracker.com", 
        "subject": f"Collision Alert: {tle1.name} and {tle2.name}",
        "text": (
            f"A high-risk conjunction has been detected between {tle1.name} (NORAD ID: {tle1.line1.split(' ')[1]}) "
            f"and {tle2.name} (NORAD ID: {tle2.line1.split(' ')[1]}).\n\n"
            f"Time of Closest Approach: {result['time_of_closest_approach_utc']} UTC\n"
            f"Minimum Distance: {result['minimum_distance_km']:.2f} km\n\n"
            f"Please take immediate action."
        )
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(notification_service_url, json=alert_data)
            response.raise_for_status() 
            print(f"Successfully sent collision alert: {response.json()}")
    except httpx.RequestError as e:
        print(f"Error sending collision alert: {e}")

@app.post("/analyze")
async def analyze_conjunction(request: ConjunctionRequest):
    start_time = datetime.utcnow()
    time_points_utc = [(start_time + timedelta(minutes=i * 10)).isoformat() + "Z" for i in range(24 * 6)] 

    async with httpx.AsyncClient() as client:
        tasks1 = [get_prediction(client, request.tle1, t) for t in time_points_utc]
        tasks2 = [get_prediction(client, request.tle2, t) for t in time_points_utc]
        
        results1 = await asyncio.gather(*tasks1)
        results2 = await asyncio.gather(*tasks2)

    pos1 = np.array([[r['position_eci_km']['x'], r['position_eci_km']['y'], r['position_eci_km']['z']] for r in results1])
    pos2 = np.array([[r['position_eci_km']['x'], r['position_eci_km']['y'], r['position_eci_km']['z']] for r in results2])

    distances = np.linalg.norm(pos1 - pos2, axis=1)
    min_dist_idx = np.argmin(distances)
    min_dist_km = distances[min_dist_idx]
    tca_utc = time_points_utc[min_dist_idx]

    result = {
        "analysis_status": "complete",
        "time_of_closest_approach_utc": tca_utc,
        "minimum_distance_km": float(min_dist_km),
        "is_collision_imminent": bool(min_dist_km < 1.0)  
    }

    if result['is_collision_imminent']:
        print(f"Collision imminent between {request.tle1.line1} and {request.tle2.line1}!")
        asyncio.create_task(send_collision_alert(request.tle1, request.tle2, result))

    return result
