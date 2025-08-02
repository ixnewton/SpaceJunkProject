from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from astropy.time import Time
from astropy.coordinates import GCRS, CartesianRepresentation
from astropy import units as u
from sgp4.api import Satrec, jday

app = FastAPI()

class TLE(BaseModel):
    line1: str = Field(..., description="Line 1 of the TLE.", example="1 25544U 98067A   25214.50905606  .00016717  00000-0  33416-4 0  9990")
    line2: str = Field(..., description="Line 2 of the TLE.", example="2 25544  51.6416 251.3426 0006703 130.5360 325.0160 15.49324113  8947")

class PredictionRequest(BaseModel):
    tle: TLE
    predict_at_utc: str = Field(..., description="ISO 8601 UTC timestamp for prediction.", example="2025-08-02T12:00:00Z")

@app.get("/")
def read_root():
    return {"message": "Orbital Calculation Engine is running"}

@app.post("/predict")
def predict_position(request: PredictionRequest):
    try:
        satellite = Satrec.twoline2rv(request.tle.line1, request.tle.line2)
        predict_time = Time(request.predict_at_utc, format='isot', scale='utc')
        jd, fr = jday(predict_time.datetime.year, predict_time.datetime.month, predict_time.datetime.day, 
                      predict_time.datetime.hour, predict_time.datetime.minute, predict_time.datetime.second)
        
        error, position_eci, velocity_eci = satellite.sgp4(jd, fr)

        if error != 0:
            raise HTTPException(status_code=400, detail=f"SGP4 propagation error: {error}")

        # Convert to astropy objects for easier handling
        pos_vector = CartesianRepresentation(position_eci, unit=u.km)
        vel_vector = CartesianRepresentation(velocity_eci, unit=u.km/u.s)

        return {
            "requested_time_utc": request.predict_at_utc,
            "position_eci_km": {"x": pos_vector.x.value, "y": pos_vector.y.value, "z": pos_vector.z.value},
            "velocity_eci_km_s": {"x": vel_vector.x.value, "y": vel_vector.y.value, "z": vel_vector.z.value}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
