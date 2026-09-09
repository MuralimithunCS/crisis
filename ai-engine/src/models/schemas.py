from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AlertAnalysisRequest(BaseModel):
    alert_id: str
    alert_type: str
    severity: str
    location: Dict[str, Any]
    parameters: Optional[Dict[str, Any]] = None

class ScenarioSimulationRequest(BaseModel):
    scenario_id: str
    disaster_type: str
    parameters: Dict[str, Any]
    location: Dict[str, Any]

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str

class SurvivalRequest(BaseModel):
    severity: str
    distance_km: float
    building_type: str = "concrete"
    age: int = 30

class SurvivalResponse(BaseModel):
    survival_probability_percentage: float
    status_label: str
