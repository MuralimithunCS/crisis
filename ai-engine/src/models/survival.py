import random  # type: ignore


class SurvivalProbabilityEngine:
    def __init__(self):
        pass

    def calculate_survival_probability(self, request_data: dict) -> float:
        """
        request_data schema:
        {
          "severity": "high",       
          "distance_km": 15.0,      
          "building_type": "concrete", 
          "age": 30                 
        }
        """
        severity = request_data.get('severity', 'medium').lower()
        distance = request_data.get('distance_km', 10.0)
        building = request_data.get('building_type', 'concrete').lower()
        age = request_data.get('age', 30)

        base_prob = 100.0

        severity_impact = {'low': 2, 'medium': 10, 'high': 30, 'critical': 60}
        prob = base_prob - severity_impact.get(severity, 10)

        if distance < 5:
            prob -= 20
        elif distance < 20:
            prob -= 5

        building_bonus = {'concrete': 10, 'steel': 15, 'wood': -10, 'mobile': -25}
        prob += building_bonus.get(building, 0)

        if age < 10 or age > 65:
            prob -= 15

        prob += random.uniform(-2.5, 2.5)

        prob = max(5.0, min(99.9, prob))
        return round(prob, 2)  # type: ignore
