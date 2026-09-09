"""
CrisisIQ AI Engine: Flash-Flood Prediction Router
Target SIH: SIH26192 - Flash Flood Prediction System for Hilly Regions

Endpoints:
- POST /flood/predict
- GET  /flood/risk-map
- GET  /flood/locations
- GET  /flood/history
- GET  /flood/history/{event_id}
- GET  /flood/model-info
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from ..models.flood_risk import FloodRiskService

router = APIRouter(prefix="/flood", tags=["Flood Prediction"])
flood_service = FloodRiskService()

class FloodPredictionRequest(BaseModel):
    location_id: Optional[str] = "kedarnath"
    rainfall_1h: float = Field(default=15.0, description="1-hour rainfall in mm")
    rainfall_3h: Optional[float] = Field(default=None, description="3-hour rainfall in mm")
    rainfall_6h: Optional[float] = Field(default=None, description="6-hour rainfall in mm")
    rainfall_24h: Optional[float] = Field(default=None, description="24-hour rainfall in mm")
    antecedent_rain_3d: Optional[float] = Field(default=None, description="3-day antecedent rainfall in mm")
    antecedent_rain_7d: Optional[float] = Field(default=None, description="7-day antecedent rainfall in mm")
    soil_moisture: float = Field(default=0.75, description="Soil moisture index (0.0 to 1.0 or 0 to 100%)")
    elevation: Optional[float] = Field(default=None, description="Elevation in meters")
    slope: Optional[float] = Field(default=None, description="Slope in degrees")
    aspect: Optional[float] = Field(default=None, description="Aspect in degrees")
    historical_flood_frequency: Optional[float] = Field(default=None, description="Historical susceptibility index (0-10)")

@router.post("/predict")
async def predict_flood_risk(request: FloodPredictionRequest) -> Dict[str, Any]:
    """
    Computes flash-flood risk probability, 4-tier classification (SAFE, WATCH, EVACUATE SOON, IMMEDIATE),
    actionable lead time, and physical explainability factors.
    """
    try:
        location_meta = flood_service.get_location_by_id(request.location_id or "kedarnath")
        payload = request.model_dump()
        result = flood_service.predict_risk(payload, location_meta)
        result["location_id"] = request.location_id
        result["location_name"] = location_meta.get("name") if location_meta else request.location_id
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/risk-map")
async def get_risk_map(location_id: str = Query(default="kedarnath", description="Location ID")) -> Dict[str, Any]:
    """
    Returns hyper-local catchment nodes, valley funnel coordinates, and safe evacuation assembly zones.
    """
    try:
        return flood_service.get_risk_map_nodes(location_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk map error: {str(e)}")

@router.get("/locations")
async def get_available_locations(country: Optional[str] = Query(default=None, description="Country code e.g. IN, NP, US, JP")) -> List[Dict[str, Any]]:
    """
    Returns available mountain catchment monitoring sites, optionally filtered by country.
    """
    try:
        return flood_service.get_locations(country_code=country)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Locations fetch error: {str(e)}")

@router.get("/history")
async def get_historical_events(country: Optional[str] = Query(default=None, description="Country code filter")) -> List[Dict[str, Any]]:
    """
    Returns historical mountain flash-flood disaster records, optionally filtered by country.
    """
    try:
        events = flood_service.get_historical_events()
        if country:
            filtered = [e for e in events if e.get("country_code", "").upper() == country.upper()]
            if filtered:
                return filtered
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Historical events fetch error: {str(e)}")

@router.get("/history/{event_id}")
async def get_historical_event_details(event_id: str) -> Dict[str, Any]:
    """
    Returns chronological progression timeline steps for a specific historical disaster.
    """
    event = flood_service.get_historical_event_details(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Historical event '{event_id}' not found")
    return event

@router.get("/model-info")
async def get_model_information() -> Dict[str, Any]:
    """
    Returns model architecture, feature importances, validation strategy, and honest metrics disclosure.
    """
    try:
        return flood_service.get_model_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model info error: {str(e)}")
