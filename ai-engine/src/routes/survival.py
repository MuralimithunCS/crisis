from fastapi import APIRouter, HTTPException
from ..models.schemas import SurvivalRequest, SurvivalResponse
from ..models.survival import SurvivalProbabilityEngine

router = APIRouter()
survival_engine = SurvivalProbabilityEngine()

@router.post("/predict/survival", response_model=SurvivalResponse)
async def predict_survival(request: SurvivalRequest):
    try:
        prob = survival_engine.calculate_survival_probability(request.dict())
        label = "Very High"
        if prob < 40:
            label = "Critical Danger"
        elif prob < 70:
            label = "Moderate Risk"
        elif prob < 90:
            label = "Good"
        return SurvivalResponse(
            survival_probability_percentage=prob,
            status_label=label
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
