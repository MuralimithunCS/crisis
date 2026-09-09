import joblib  # type: ignore
import aiohttp  # type: ignore
import os


class RiskAssessmentService:
    def __init__(self):
        self.model = self._load_model()
        self.feature_weights = {
            'earthquake': {
                'magnitude': 0.35,
                'depth': 0.15,
                'population_density': 0.25,
                'infrastructure_age': 0.15,
                'soil_type': 0.10
            },
            'flood': {
                'water_level': 0.30,
                'rainfall_intensity': 0.20,
                'drainage_capacity': 0.20,
                'elevation': 0.15,
                'population_density': 0.15
            },
            'fire': {
                'wind_speed': 0.25,
                'humidity': 0.20,
                'vegetation_density': 0.20,
                'temperature': 0.15,
                'accessibility': 0.20
            }
        }

    def _load_model(self):
        """Load pre-trained risk model or create default"""
        try:
            return joblib.load('models/risk_model.joblib')
        except Exception:
            # Return a simple rule-based fallback
            return None

    async def assess_risk(
        self,
        disaster_type: str,
        severity: str,
        location: dict
    ) -> float:
        """Calculate risk score (0-100) for a disaster alert"""

        # Gather environmental data
        env_data = await self._fetch_environmental_data(location)

        # Get population density
        pop_density = await self._get_population_density(location)

        # Get infrastructure vulnerability
        infra_score = await self._assess_infrastructure(location, disaster_type)

        # Calculate weighted risk score
        base_score = self._severity_to_score(severity)

        # Apply disaster-specific factors
        factors = self._calculate_risk_factors(
            disaster_type,
            env_data,
            pop_density,
            infra_score
        )

        # Combine scores
        risk_score = base_score * factors['multiplier']

        # Normalize to 0-100
        return min(100.0, max(0.0, float(risk_score)))

    def _severity_to_score(self, severity: str) -> float:
        return {
            'low': 25,
            'medium': 50,
            'high': 75,
            'critical': 95
        }.get(severity, 50)

    async def _fetch_environmental_data(self, location: dict) -> dict:
        """Fetch weather and environmental conditions"""
        coords = location.get('coordinates', [0, 0])

        async with aiohttp.ClientSession() as session:
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                'lat': coords[1],
                'lon': coords[0],
                'appid': os.getenv('OPENWEATHER_API_KEY', 'default'),
                'units': 'metric'
            }
            try:
                async with session.get(url, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {
                            'temperature': data['main']['temp'],
                            'humidity': data['main']['humidity'],
                            'wind_speed': data['wind']['speed'],
                            'weather_condition': data['weather'][0]['main']
                        }
            except Exception:
                pass

        return {}

    async def _get_population_density(self, location: dict) -> float:
        """Estimate population density for location"""
        # In production, integrate with census/population APIs
        # Using rough estimates based on location type
        region = location.get('region', '').lower()

        if 'metro' in region or 'city' in region:
            return 10000  # per sq km
        elif 'urban' in region:
            return 5000
        elif 'suburban' in region:
            return 2000
        else:
            return 500

    async def _assess_infrastructure(
        self,
        location: dict,
        disaster_type: str
    ) -> float:
        """Assess infrastructure vulnerability (0-1)"""
        # In production, use actual building/infrastructure databases
        # Simplified scoring
        return 0.5  # Moderate vulnerability

    def _calculate_risk_factors(
        self,
        disaster_type: str,
        env_data: dict,
        pop_density: float,
        infra_score: float
    ) -> dict:
        """Calculate risk multiplication factors"""

        multiplier = 1.0

        # Population density factor
        if pop_density > 8000:
            multiplier *= 1.3
        elif pop_density > 4000:
            multiplier *= 1.15

        # Infrastructure vulnerability
        multiplier *= (1 + infra_score * 0.3)

        # Weather conditions
        if disaster_type == 'fire':
            if env_data.get('humidity', 50) < 30:
                multiplier *= 1.2
            if env_data.get('wind_speed', 0) > 20:
                multiplier *= 1.15
        elif disaster_type == 'flood':
            if env_data.get('weather_condition') == 'Rain':
                multiplier *= 1.25

        return {'multiplier': multiplier}
