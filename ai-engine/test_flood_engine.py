"""
Unit & Integration Verification for CrisisIQ Flash-Flood Prediction Engine
"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from models.flood_risk import FloodRiskService

def run_tests():
    print("Testing FloodRiskService initialization...")
    service = FloodRiskService()

    # 1. Test Locations
    locs = service.get_locations()
    assert len(locs) >= 5, f"Expected at least 5 demo locations, got {len(locs)}"
    print(f"[OK] Found {len(locs)} demo locations: {[l['id'] for l in locs]}")

    # 2. Test Historical Events
    events = service.get_historical_events()
    assert len(events) >= 4, f"Expected 4 historical events, got {len(events)}"
    print(f"[OK] Found {len(events)} historical events: {[e['id'] for e in events]}")

    # 3. Test Prediction - Baseline Safe condition
    safe_features = {
        "rainfall_1h": 3.0,
        "rainfall_3h": 7.0,
        "rainfall_6h": 12.0,
        "rainfall_24h": 25.0,
        "antecedent_rain_3d": 35.0,
        "antecedent_rain_7d": 50.0,
        "soil_moisture": 0.35,
        "slope": 25.0,
        "elevation": 1800.0,
        "historical_flood_frequency": 5.0
    }
    safe_pred = service.predict_risk(safe_features)
    print(f"[OK] Safe Condition Prediction: prob={safe_pred['risk_probability']}, level={safe_pred['risk_level']}")
    assert safe_pred["risk_level"] in ["SAFE", "WATCH"], f"Expected SAFE or WATCH, got {safe_pred['risk_level']}"

    # 4. Test Prediction - Critical Cloudburst Condition (Immediate Danger)
    extreme_features = {
        "rainfall_1h": 75.0,
        "rainfall_3h": 160.0,
        "rainfall_6h": 240.0,
        "rainfall_24h": 340.0,
        "antecedent_rain_3d": 380.0,
        "antecedent_rain_7d": 520.0,
        "soil_moisture": 0.97,
        "slope": 38.0,
        "elevation": 3500.0,
        "historical_flood_frequency": 8.5
    }
    extreme_pred = service.predict_risk(extreme_features)
    print(f"[OK] Extreme Condition Prediction: prob={extreme_pred['risk_probability']}, level={extreme_pred['risk_level']}")
    print(f"  Top Factors: {extreme_pred['top_factors']}")
    print(f"  Lead Time: {extreme_pred['lead_time_label']}")
    assert extreme_pred["risk_level"] == "IMMEDIATE", f"Expected IMMEDIATE, got {extreme_pred['risk_level']}"
    assert len(extreme_pred["top_factors"]) > 0, "Expected non-empty top factors"

    # 5. Test Hyper-local Risk Map Nodes
    map_nodes = service.get_risk_map_nodes("kedarnath")
    assert "catchment_nodes" in map_nodes and len(map_nodes["catchment_nodes"]) >= 3
    assert "safe_zones" in map_nodes and len(map_nodes["safe_zones"]) >= 1
    print(f"[OK] Kedarnath Catchment Nodes: {len(map_nodes['catchment_nodes'])}, Safe Zones: {len(map_nodes['safe_zones'])}")

    # 6. Test Model Info
    info = service.get_model_info()
    assert "metrics" in info
    print(f"[OK] Model Info Metrics: Precision={info['metrics']['precision']}, Recall={info['metrics']['recall']}, F1={info['metrics']['f1_score']}, ROC-AUC={info['metrics']['roc_auc']}")

    print("\nALL AI-ENGINE FLASH FLOOD TESTS PASSED SUCCESSFULLY! [OK]")

if __name__ == "__main__":
    run_tests()
