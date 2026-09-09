from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from ..models.schemas import ScenarioSimulationRequest
from ..models.evacuation import EvacuationPlanner

router = APIRouter()
evacuation_service = EvacuationPlanner()

@router.post("/simulate/scenario")
async def simulate_scenario(request: ScenarioSimulationRequest):
    """Run a disaster scenario simulation"""
    try:
        simulation = await run_scenario_simulation(request)
        return simulation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_area_data(location: dict) -> dict:
    return {}

async def simulate_earthquake(magnitude: float, location: dict, area_data: dict) -> dict:
    coords = location.get('coordinates', [0, 0])
    affected_radius = float(10 + magnitude * 3.5)
    affected_zones = [
        {
            'center': coords,
            'disaster_type': 'earthquake',
            'radius': affected_radius
        }
    ]
    return {'affected_zones': affected_zones, 'affected_radius': affected_radius}

async def simulate_flood(water_level: float, location: dict, area_data: dict) -> dict:
    coords = location.get('coordinates', [0, 0])
    affected_radius = float(15 + water_level * 2.5)
    affected_zones = [
        {
            'center': coords,
            'disaster_type': 'flood',
            'radius': affected_radius
        }
    ]
    return {'affected_zones': affected_zones, 'affected_radius': affected_radius}

async def simulate_generic_disaster(disaster_type: str, parameters: dict, location: dict, area_data: dict) -> dict:
    coords = location.get('coordinates', [0, 0])
    affected_radius = float(20)
    affected_zones = [
        {
            'center': coords,
            'disaster_type': disaster_type,
            'radius': affected_radius
        }
    ]
    return {'affected_zones': affected_zones, 'affected_radius': affected_radius}

async def generate_disaster_timeline(disaster_type: str, results: dict) -> list:
    # Keep a small deterministic timeline so the frontend can render without empties.
    safe_zone_note = "Move to pre-identified safe zones and follow official updates."
    evacuate_note = "Prepare to evacuate using designated routes; avoid flooded/blocked roads."
    if disaster_type == 'flood':
        evacuate_note = "Avoid floodwaters; evacuate to higher ground immediately."
    if disaster_type == 'earthquake':
        evacuate_note = "Drop, cover, and hold on; evacuate after shaking stops if structures are unsafe."

    return [
        {
            'hour': 0,
            'event': f'{disaster_type.replace("_", " ").title()} warning issued',
            'recommendation': safe_zone_note
        },
        {
            'hour': 2,
            'event': 'Evacuation planning window',
            'recommendation': evacuate_note
        },
        {
            'hour': 6,
            'event': 'Resource deployment and coordination',
            'recommendation': 'Coordinate with responders, check-in on vulnerable neighbors, and conserve power.'
        }
    ]

async def run_scenario_simulation(request: ScenarioSimulationRequest) -> dict:
    """Full scenario simulation with timeline"""

    # Get population and infrastructure data
    area_data = await get_area_data(request.location)

    # Run simulation based on disaster type
    if request.disaster_type == 'earthquake':
        results = await simulate_earthquake(
            magnitude=request.parameters.get('magnitude', 6.0),
            location=request.location,
            area_data=area_data
        )
    elif request.disaster_type == 'flood':
        results = await simulate_flood(
            water_level=request.parameters.get('water_level', 2.0),
            location=request.location,
            area_data=area_data
        )
    else:
        results = await simulate_generic_disaster(
            request.disaster_type,
            request.parameters,
            request.location,
            area_data
        )

    # Generate timeline
    timeline = await generate_disaster_timeline(
        request.disaster_type,
        results
    )

    return {
        'scenario_id': request.scenario_id,
        'results': results,
        'timeline': timeline,
        'evacuation_plan': await evacuation_service.create_full_plan(
            request.location,
            results['affected_zones']
        )
    }
