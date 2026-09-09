"""
CrisisIQ Flash-Flood Prediction Engine: Dataset Generator
Target SIH: SIH26192 - Flash Flood Prediction System for Hilly Regions

Generates a physically-informed synthetic hydrological dataset representing mountain catchments.
Uses physical hydrological relationships:
- Precipitation Intensity-Duration-Frequency (IDF)
- Antecedent Precipitation Index (API) with decay
- Topographic wetness and slope-runoff dynamics
- Soil saturation thresholds governing flash runoff initiation
"""

import os
import csv
import random
import math
from datetime import datetime, timedelta

def generate_catchment_dataset(num_samples: int = 5000, output_path: str = "data/flood_dataset.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Base locations representing varying mountainous topographies
    archetypes = [
        {"name": "High Glacial Valley", "elevation": (2800, 4200), "slope": (30, 48), "hist_freq": (6.5, 9.5)},
        {"name": "Narrow Mountain Gorge", "elevation": (1400, 2600), "slope": (25, 40), "hist_freq": (6.0, 8.5)},
        {"name": "Mid-Elevation River Basin", "elevation": (900, 1800), "slope": (18, 32), "hist_freq": (5.0, 7.5)},
        {"name": "Western Ghats Escarpment", "elevation": (600, 1500), "slope": (24, 38), "hist_freq": (7.0, 9.8)},
        {"name": "Foothill Alluvial Valley", "elevation": (400, 1100), "slope": (10, 24), "hist_freq": (3.5, 6.0)}
    ]

    start_date = datetime(2021, 1, 1)
    fieldnames = [
        "timestamp", "location_type", "rainfall_1h", "rainfall_3h", "rainfall_6h",
        "rainfall_24h", "antecedent_rain_3d", "antecedent_rain_7d",
        "soil_moisture", "elevation", "slope", "aspect",
        "historical_flood_frequency", "flood_probability", "risk_level", "flash_flood_event"
    ]

    records = []
    current_time = start_date

    for i in range(num_samples):
        # Time progression (chronological ordering for temporal validation)
        current_time += timedelta(hours=random.choice([2, 4, 6, 8]))
        month = current_time.month

        # Monsoon seasonality factor (June-September in India brings high precipitation)
        is_monsoon = 6 <= month <= 9
        is_transition = month in [5, 10]
        seasonal_multiplier = 2.4 if is_monsoon else (1.4 if is_transition else 0.5)

        arch = random.choice(archetypes)
        elevation = round(random.uniform(*arch["elevation"]), 1)
        slope = round(random.uniform(*arch["slope"]), 1)
        aspect = round(random.uniform(0, 360), 1)
        hist_freq = round(random.uniform(*arch["hist_freq"]), 2)

        # Generate correlated precipitation values
        # Cloudburst / intense thunderstorm probability
        is_extreme_event = (random.random() < 0.12 if is_monsoon else random.random() < 0.03)

        if is_extreme_event:
            r1h = random.uniform(35.0, 85.0)
            r3h = r1h + random.uniform(30.0, 75.0)
            r6h = r3h + random.uniform(30.0, 90.0)
            r24h = r6h + random.uniform(40.0, 120.0)
            ant3d = r24h + random.uniform(60.0, 180.0)
            ant7d = ant3d + random.uniform(80.0, 240.0)
            soil_moist = min(0.99, max(0.70, random.uniform(0.78, 0.99)))
        else:
            r1h = random.expovariate(0.25 / seasonal_multiplier)
            r1h = min(40.0, max(0.0, r1h))
            r3h = r1h + random.expovariate(0.15 / seasonal_multiplier)
            r6h = r3h + random.expovariate(0.10 / seasonal_multiplier)
            r24h = r6h + random.expovariate(0.05 / seasonal_multiplier)
            ant3d = r24h + random.uniform(10.0, 80.0) * seasonal_multiplier
            ant7d = ant3d + random.uniform(20.0, 140.0) * seasonal_multiplier
            
            base_moist = 0.35 + 0.35 * (ant7d / (350.0 * seasonal_multiplier + 1))
            soil_moist = min(0.95, max(0.15, base_moist + random.gauss(0, 0.05)))

        # Physical formula for flash flood initiation probability:
        # P = f(intensity, soil_saturation, slope, antecedent wetness, susceptibility)
        # 1. Rainfall intensity contribution
        rain_factor = (
            (r1h / 60.0) * 0.35 +
            (r3h / 120.0) * 0.25 +
            (r6h / 180.0) * 0.15 +
            (r24h / 250.0) * 0.15
        )
        # 2. Antecedent wetness & soil saturation contribution
        wetness_factor = (soil_moist ** 1.8) * 0.40 + ((ant7d / 400.0) ** 1.2) * 0.20
        # 3. Terrain steepness acceleration (gravity runoff coefficient)
        slope_factor = (slope / 45.0) * 0.25
        # 4. Historical susceptibility
        hist_factor = (hist_freq / 10.0) * 0.15

        # Compound raw score with non-linear interaction when soil is already saturated
        interaction_surge = 0.35 if (soil_moist > 0.82 and r3h > 50.0) else 0.0
        
        raw_prob = (
            rain_factor * 0.45 +
            wetness_factor * 0.25 +
            slope_factor * 0.15 +
            hist_factor * 0.15 +
            interaction_surge +
            random.gauss(0, 0.035)  # Natural stochastic hydrological variance
        )
        
        # Normalize probability to 0.0 - 1.0 using sigmoid-like scaling
        prob = 1.0 / (1.0 + math.exp(-6.5 * (raw_prob - 0.46)))
        prob = round(min(0.999, max(0.005, prob)), 4)

        # Classification into the 4 standard CrisisIQ tiers:
        # SAFE (< 0.30), WATCH (0.30 - 0.59), EVACUATE SOON (0.60 - 0.79), IMMEDIATE (>= 0.80)
        if prob < 0.30:
            risk_level = "SAFE"
            event_flag = 0
        elif prob < 0.60:
            risk_level = "WATCH"
            event_flag = 0
        elif prob < 0.80:
            risk_level = "EVACUATE SOON"
            event_flag = 1
        else:
            risk_level = "IMMEDIATE"
            event_flag = 1

        records.append({
            "timestamp": current_time.isoformat(),
            "location_type": arch["name"],
            "rainfall_1h": round(r1h, 2),
            "rainfall_3h": round(r3h, 2),
            "rainfall_6h": round(r6h, 2),
            "rainfall_24h": round(r24h, 2),
            "antecedent_rain_3d": round(ant3d, 2),
            "antecedent_rain_7d": round(ant7d, 2),
            "soil_moisture": round(soil_moist, 3),
            "elevation": elevation,
            "slope": slope,
            "aspect": aspect,
            "historical_flood_frequency": hist_freq,
            "flood_probability": prob,
            "risk_level": risk_level,
            "flash_flood_event": event_flag
        })

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Generated {num_samples} records saved to {output_path}")

if __name__ == "__main__":
    generate_catchment_dataset(5000, "ai-engine/data/flood_dataset.csv")
