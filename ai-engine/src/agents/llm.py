import openai  # type: ignore
from typing import List
import json
import os


class LLMService:
    def __init__(self):
        self.use_mock = os.getenv('USE_MOCK_LLM', 'false').lower() == 'true'
        api_key = os.getenv('OPENAI_API_KEY', '')

        if not self.use_mock and not api_key:
            print("OPENAI_API_KEY not found. Falling back to Mock LLM mode.")
            self.use_mock = True

        if not self.use_mock:
            self.client = openai.AsyncOpenAI(api_key=api_key)
        self.model = "gpt-4-turbo-preview"

    async def generate_recommendations(
        self,
        disaster_type: str,
        severity: str,
        impact: dict,
        context: dict
    ) -> List[str]:
        """Generate actionable recommendations using LLM"""

        prompt = self._build_recommendation_prompt(
            disaster_type, severity, impact, context
        )

        if self.use_mock:
            return self._fallback_recommendations(disaster_type, severity)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert disaster response advisor. Provide specific, actionable recommendations for disaster response. Focus on immediate safety, resource allocation, and coordination. Be concise and prioritize by urgency."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )

            content = response.choices[0].message.content
            return self._parse_recommendations(content)

        except Exception as e:
            print(f"LLM error: {e}")
            return self._fallback_recommendations(disaster_type, severity)

    def _build_recommendation_prompt(
        self,
        disaster_type: str,
        severity: str,
        impact: dict,
        context: dict
    ) -> str:
        return f"""
        Disaster Analysis Request:
        
        Type: {disaster_type.upper()}
        Severity: {severity.upper()}
        Risk Score: {context.get('risk_score', 'Unknown')}/100
        
        Impact Assessment:
        - Estimated affected population: {impact.get('estimated_affected', 'Unknown')}
        - Infrastructure risk: {impact.get('infrastructure_risk', 'Unknown')}
        - Affected area: {impact.get('affected_area_km2', 'Unknown')} sq km
        
        Location Context:
        - Region: {context.get('location', {}).get('region', 'Unknown')}
        - Coordinates: {context.get('location', {}).get('coordinates', 'Unknown')}
        
        Provide 5-7 prioritized recommendations for:
        1. Immediate citizen safety actions
        2. Emergency responder priorities  
        3. Resource deployment
        4. Communication protocols
        5. Evacuation considerations
        
        Format each recommendation as a clear, actionable statement.
        """

    def _parse_recommendations(self, content: str) -> List[str]:
        """Parse LLM response into list of recommendations"""
        lines = content.strip().split('\n')
        recommendations = []

        for line in lines:
            line = line.strip()
            # Remove numbering and bullet points
            if line and not line.startswith('#'):
                clean = line.lstrip('0123456789.-) ')
                if clean and len(clean) > 10:
                    recommendations.append(clean)

        return [r for i, r in enumerate(recommendations) if i < 7]

    async def chat_with_assistant(self, message: str) -> str:
        if self.use_mock:
            return "I am operating in mock mode because no API key was provided. I am here to assist!"

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are CrisisIQ Assistant, a helpful AI that assists users during disasters and emergencies."
                    },
                    {"role": "user", "content": message}
                ],
                temperature=0.5,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Chat error: {e}")
            return "I am experiencing connectivity issues right now. Please try again later."

    def _fallback_recommendations(
        self,
        disaster_type: str,
        severity: str
    ) -> List[str]:
        """Provide fallback recommendations if LLM fails"""

        base = [
            "Move to higher ground or designated safe zones immediately",
            "Keep emergency supplies accessible (water, first aid, flashlight)",
            "Monitor official emergency channels for updates",
            "Check on vulnerable neighbors and family members",
            "Keep phone charged for emergency communications"
        ]

        type_specific = {
            'earthquake': [
                "Drop, cover, and hold on during shaking",
                "Stay away from windows, heavy furniture, and exterior walls",
                "After shaking stops, check for structural damage before re-entering buildings"
            ],
            'flood': [
                "Never walk or drive through flood waters",
                "Move valuables and important documents to upper floors",
                "Turn off electricity if water enters your home"
            ],
            'fire': [
                "Close all windows and doors to prevent draft",
                "Prepare to evacuate: gather essentials in a go-bag",
                "Stay low if smoke is present; cover nose with wet cloth"
            ]
        }

        return type_specific.get(disaster_type, base)

    async def generate_scenario_narrative(
        self,
        disaster_type: str,
        parameters: dict,
        timeline: List[dict]
    ) -> str:
        """Generate a narrative description of a simulated scenario"""

        prompt = f"""
        Create a brief, realistic narrative for this disaster scenario:
        
        Type: {disaster_type}
        Parameters: {json.dumps(parameters)}
        
        Timeline Events:
        {json.dumps(timeline, indent=2)}
        
        Write a 2-3 paragraph narrative that:
        1. Describes how the disaster unfolds
        2. Highlights critical decision points
        3. Emphasizes the importance of preparedness
        
        Keep it informative but not sensationalized.
        """

        if self.use_mock:
            return "Mock narrative: This is a simulated disaster generated for demonstration purposes."

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a disaster preparedness educator creating realistic scenario descriptions."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception:
            return "Narrative failed to load."
