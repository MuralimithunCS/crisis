from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
import redis
import json
import os
from datetime import datetime

from ..models.schemas import AlertAnalysisRequest
from ..models.risk import RiskAssessmentService
from ..models.impact import ImpactPredictionService
from ..models.evacuation import EvacuationPlanner
from ..agents.llm import LLMService

router = APIRouter()

redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=6379,
    password=os.getenv('REDIS_PASSWORD'),
    decode_responses=True
)

risk_service = RiskAssessmentService()
impact_service = ImpactPredictionService()
evacuation_service = EvacuationPlanner()
llm_service = LLMService()

def notify_backend(alert_id: str, analysis: dict):
    pass  # Stub for notifying backend from background task

@router.post("/analyze/alert")
async def analyze_alert(request: AlertAnalysisRequest, background_tasks: BackgroundTasks):
    """Analyze an alert and generate AI insights"""
    try:
        cache_key = f"analysis:{request.alert_id}"
        try:
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass  # Redis offline or unavailable, proceed to analysis

        # Perform analysis
        analysis = await perform_alert_analysis(request)

        # Cache results safely
        try:
            redis_client.setex(cache_key, 3600, json.dumps(analysis))
        except Exception:
            pass

        # Notify backend asynchronously
        background_tasks.add_task(notify_backend, request.alert_id, analysis)

        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def perform_alert_analysis(request: AlertAnalysisRequest) -> dict:
    """Orchestrate all AI analysis components"""

    # 1. Risk Assessment
    risk_score = await risk_service.assess_risk(
        disaster_type=request.alert_type,
        severity=request.severity,
        location=request.location
    )

    # 2. Impact Prediction
    impact = await impact_service.predict_impact(
        disaster_type=request.alert_type,
        severity=request.severity,
        location=request.location,
        risk_score=risk_score
    )

    # 3. Resource Needs Estimation
    resources = await impact_service.estimate_resources(
        estimated_affected=impact['estimated_affected'],
        disaster_type=request.alert_type
    )

    # 4. Evacuation Routes
    evacuation_routes = await evacuation_service.plan_routes(
        origin=request.location,
        disaster_type=request.alert_type,
        affected_radius=impact.get('affected_radius', 10)
    )

    # 5. LLM-powered Recommendations
    recommendations = await llm_service.generate_recommendations(
        disaster_type=request.alert_type,
        severity=request.severity,
        impact=impact,
        context={
            'risk_score': risk_score,
            'location': request.location
        }
    )

    return {
        'risk_score': risk_score,
        'impact_prediction': impact,
        'resource_needs': resources,
        'evacuation_routes': evacuation_routes,
        'recommendations': recommendations,
        'survival_probability': calculate_survival_probability_internal(
            risk_score, request.severity
        ),
        'processed_at': datetime.utcnow().isoformat()
    }

def calculate_survival_probability_internal(risk_score: float, severity: str) -> float:
    """Calculate survival probability based on risk and severity"""
    base_probability = {
        'low': 0.99,
        'medium': 0.95,
        'high': 0.85,
        'critical': 0.70
    }.get(severity, 0.90)

    # Adjust based on risk score (0-100)
    adjustment = (100 - risk_score) / 100 * 0.1

    return min(0.99, base_probability + adjustment)
