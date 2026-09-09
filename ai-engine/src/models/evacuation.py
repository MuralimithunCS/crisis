import aiohttp  # type: ignore
from typing import List
import os


class EvacuationPlanner:
    def __init__(self):
        self.google_maps_key = os.getenv('GOOGLE_MAPS_API_KEY')
        self.safe_zone_types = [
            'hospital',
            'school',
            'stadium',
            'community_center',
            'government_office'
        ]

    async def plan_routes(
        self,
        origin: dict,
        disaster_type: str,
        affected_radius: float
    ) -> List[dict]:
        """Plan evacuation routes from origin to safe zones"""

        # Find nearby safe zones
        safe_zones = await self._find_safe_zones(
            origin['coordinates'],
            affected_radius * 1.5  # Search beyond affected area
        )

        # Filter zones based on disaster type
        viable_zones = self._filter_zones_for_disaster(
            safe_zones, disaster_type
        )

        # Get routes to top 3 zones
        routes = []
        for i, zone in enumerate(viable_zones):
            if i >= 3:
                break
            route = await self._get_route(
                origin['coordinates'],
                [zone['geometry']['location']['lng'],
                 zone['geometry']['location']['lat']]
            )
            if route:
                routes.append({
                    'destination': {
                        'name': zone.get('name', 'Safe Zone'),
                        'address': zone.get('vicinity', ''),
                        'coordinates': [
                            zone['geometry']['location']['lng'],
                            zone['geometry']['location']['lat']
                        ]
                    },
                    'distance': route['distance'],
                    'duration': route['duration'],
                    'polyline': route['polyline'],
                    'steps': route['steps']
                })

        return routes

    async def _find_safe_zones(
        self,
        coordinates: List[float],
        radius_km: float
    ) -> List[dict]:
        """Find safe zones using Google Places API"""
        if not self.google_maps_key:
            return []

        safe_zones = []

        async with aiohttp.ClientSession() as session:
            for place_type in self.safe_zone_types:
                url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
                params = {
                    'location': f"{coordinates[1]},{coordinates[0]}",
                    'radius': int(radius_km * 1000),
                    'type': place_type,
                    'key': self.google_maps_key
                }

                try:
                    async with session.get(url, params=params) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            for place in data.get('results', []):
                                place['zone_type'] = place_type
                                safe_zones.append(place)
                except Exception:
                    pass

        # Sort by rating and distance
        safe_zones.sort(
            key=lambda x: (
                -x.get('rating', 0),
                x.get('distance', float('inf'))
            )
        )

        return safe_zones

    def _filter_zones_for_disaster(
        self,
        zones: List[dict],
        disaster_type: str
    ) -> List[dict]:
        """Filter zones based on disaster type suitability"""

        # Exclude certain zone types based on disaster
        exclusions = {
            'flood': ['basement', 'underground'],
            'earthquake': ['high_rise', 'old_building'],
            'fire': ['forest', 'industrial']
        }

        excluded_keywords = exclusions.get(disaster_type, [])

        return [
            z for z in zones
            if not any(
                kw in z.get('name', '').lower()
                for kw in excluded_keywords
            )
        ]

    async def _get_route(
        self,
        origin: List[float],
        destination: List[float]
    ) -> dict:
        """Get route using Google Directions API"""
        if not self.google_maps_key:
            return {}

        async with aiohttp.ClientSession() as session:
            url = "https://maps.googleapis.com/maps/api/directions/json"
            params = {
                'origin': f"{origin[1]},{origin[0]}",
                'destination': f"{destination[1]},{destination[0]}",
                'mode': 'walking',  # Walking for evacuations
                'alternatives': True,
                'key': self.google_maps_key
            }

            try:
                async with session.get(url, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()

                        if data.get('routes'):
                            route = data['routes'][0]
                            leg = route['legs'][0]

                            return {
                                'distance': leg['distance']['value'],  # meters
                                'duration': leg['duration']['value'],  # seconds
                                'polyline': route['overview_polyline']['points'],
                                'steps': [
                                    {
                                        'instruction': step['html_instructions'],
                                        'distance': step['distance']['text'],
                                        'duration': step['duration']['text']
                                    }
                                    for step in leg['steps']
                                ]
                            }
            except Exception:
                pass

        return {}

    async def create_full_plan(
        self,
        location: dict,
        affected_zones: List[dict]
    ) -> dict:
        """Create comprehensive evacuation plan for a region"""

        plan = {
            'primary_routes': [],
            'assembly_points': [],
            'shelter_locations': [],
            'medical_facilities': [],
            'coordination_notes': []
        }

        # Get routes from multiple starting points
        for zone in affected_zones:
            routes = await self.plan_routes(
                {'coordinates': zone.get('center', [0, 0])},
                zone.get('disaster_type', 'unknown'),
                zone.get('radius', 10)
            )
            plan['primary_routes'].extend(routes)

        # Find assembly points
        plan['assembly_points'] = await self._find_assembly_points(
            location.get('coordinates', [0, 0]),
            30  # 30km radius
        )

        return plan

    async def _find_assembly_points(self, coords: List[float], radius: float) -> List[dict]:
        return []
