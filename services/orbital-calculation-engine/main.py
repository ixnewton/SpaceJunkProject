"""
Provides a FastAPI service for orbital calculations and predictions.

This service uses the SGP4 propagation model to predict the position and
velocity of a satellite at a given time, based on its Two-Line Element (TLE) set.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from astropy.time import Time
from astropy.coordinates import GCRS, CartesianRepresentation
from astropy import units as u
from sgp4.api import Satrec, jday

app = FastAPI()


class TLE(BaseModel):
    """
    Represents a Two-Line Element (TLE) set for orbit determination.

    Attributes:
        line1: The first line of the TLE data.
        line2: The second line of the TLE data.
    """
    line1: str = Field(..., description="Line 1 of the TLE.", example="1 25544U 98067A   25214.50905606  .00016717  00000-0  33416-4 0  9990")
    line2: str = Field(..., description="Line 2 of the TLE.", example="2 25544  51.6416 251.3426 0006703 130.5360 325.0160 15.49324113  8947")


class PredictionRequest(BaseModel):
    """
    Defines the request model for the position prediction endpoint.

    Attributes:
        tle: The TLE of the object to predict.
        predict_at_utc: The ISO 8601 formatted UTC time for the prediction.
    """
    tle: TLE
    predict_at_utc: str = Field(..., description="ISO 8601 UTC timestamp for prediction.", example="2025-08-02T12:00:00Z")


@app.get("/")
def read_root():
    """
    A simple root endpoint to confirm the service is running.

    Returns:
        A dictionary with a confirmation message.
    """
    return {"message": "Orbital Calculation Engine is running"}


@app.post("/predict")
def predict_position(request: PredictionRequest) -> dict:
    """
    Predicts the Earth-Centered Inertial (ECI) position and velocity of a satellite.

    This function takes a TLE and a future time, initializes the SGP4
    propagator, and computes the satellite's state vector (position and
    velocity) for that instant.

    Args:
        request: A PredictionRequest object containing the satellite's TLE
                 and the UTC time for the prediction.

    Returns:
        A dictionary containing the requested time, the predicted ECI position
        in kilometers, and the predicted ECI velocity in kilometers per second.

    Raises:
        HTTPException: If the SGP4 propagation fails or if any other
                       error occurs during processing.
    """
    try:
        satellite = Satrec.twoline2rv(request.tle.line1, request.tle.line2)
        predict_time = Time(request.predict_at_utc, format='isot', scale='utc')
        jd, fr = jday(predict_time.datetime.year, predict_time.datetime.month, predict_time.datetime.day,
                      predict_time.datetime.hour, predict_time.datetime.minute, predict_time.datetime.second)

        error, position_eci, velocity_eci = satellite.sgp4(jd, fr)

        if error != 0:
            error_messages = {
                1: "mean elements, ecc >= 1.0 or ecc < -0.001 or a < 0.95 er",
                2: "mean motion less than 0.0",
                3: "pert elements, ecc < 0.0 or ecc > 1.0",
                4: "semi-latus rectum < 0.0",
                5: "epoch elements are sub-orbital",
                6: "satellite has decayed",
            }
            raise HTTPException(status_code=400, detail=f"SGP4 propagation error {error}: {error_messages.get(error, 'Unknown error')}")

        # Convert to astropy objects for easier handling
        pos_vector = CartesianRepresentation(position_eci, unit=u.km)
        vel_vector = CartesianRepresentation(velocity_eci, unit=u.km/u.s)

        return {
            "requested_time_utc": request.predict_at_utc,
            "position_eci_km": {"x": pos_vector.x.value, "y": pos_vector.y.value, "z": pos_vector.z.value},
            "velocity_eci_km_s": {"x": vel_vector.x.value, "y": vel_vector.y.value, "z": vel_vector.z.value}
        }
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
