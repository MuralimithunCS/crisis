import { Router } from 'express';
import axios from 'axios';
import { alertStore } from '../config/memoryStore.js';

const router = Router();
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
const TIMEOUT_MS = 5000;

// Local fallback datasets if AI engine is temporarily offline during live demo
const LOCAL_LOCATIONS = [
  {
    id: "kedarnath",
    name: "Kedarnath Valley",
    state: "Uttarakhand",
    region: "Mandakini Basin / Garhwal Himalayas",
    coordinates: [79.0669, 30.7346],
    elevation_m: 3583,
    slope_deg: 38.5,
    catchment_area_sqkm: 68.4,
    historical_flood_frequency: 8.5,
    baseline: {
      rainfall_1h: 12.5,
      rainfall_3h: 34.0,
      rainfall_6h: 58.0,
      rainfall_24h: 115.0,
      antecedent_rain_3d: 145.0,
      antecedent_rain_7d: 210.0,
      soil_moisture: 0.78
    },
    safe_zones: [
      { name: "Kedarnath Helipad High Ridge", coordinates: [79.0695, 30.7380], elevation_m: 3620, type: "Elevated Reinforced Plateau" },
      { name: "Bhairavnath Temple Ridge Refuge", coordinates: [79.0720, 30.7320], elevation_m: 3690, type: "High Ground Rock Outcrop" }
    ],
    catchment_nodes: [
      { id: "kdr-upper", name: "Chorabari Glacial Catchment", coordinates: [79.0620, 30.7510], elevation_m: 3950, slope_deg: 44.0, role: "Upstream Catchment Inflow" },
      { id: "kdr-temple", name: "Temple Settlement Core", coordinates: [79.0669, 30.7346], elevation_m: 3583, slope_deg: 28.0, role: "Settlement Vulnerability Node" },
      { id: "kdr-lower", name: "Rambara Gorge Confluence", coordinates: [79.0600, 30.6950], elevation_m: 2740, slope_deg: 36.0, role: "Downstream Drainage Funnel" }
    ]
  },
  {
    id: "chamoli",
    name: "Chamoli / Joshimath Valley",
    state: "Uttarakhand",
    region: "Rishiganga - Dhauliganga Basin",
    coordinates: [79.5630, 30.5560],
    elevation_m: 1890,
    slope_deg: 32.0,
    catchment_area_sqkm: 142.0,
    historical_flood_frequency: 7.8,
    baseline: {
      rainfall_1h: 8.0,
      rainfall_3h: 22.0,
      rainfall_6h: 41.0,
      rainfall_24h: 78.0,
      antecedent_rain_3d: 95.0,
      antecedent_rain_7d: 140.0,
      soil_moisture: 0.64
    },
    safe_zones: [
      { name: "Joshimath Cantonment High Terrace", coordinates: [79.5680, 30.5620], elevation_m: 2040, type: "Upper Bedrock Terrace" }
    ],
    catchment_nodes: [
      { id: "chm-upstream", name: "Ronti Glacier Valley Head", coordinates: [79.7100, 30.4800], elevation_m: 3800, slope_deg: 41.0, role: "Upstream Steep Chute" },
      { id: "chm-mid", name: "Raini Village Bridge Crossing", coordinates: [79.6910, 30.4860], elevation_m: 2020, slope_deg: 31.0, role: "Narrow Gorge Choke Point" },
      { id: "chm-tapovan", name: "Tapovan Barrage Sector", coordinates: [79.6230, 30.4950], elevation_m: 1820, slope_deg: 19.0, role: "Downstream Settlement & Infrastructure" }
    ]
  },
  {
    id: "mangan",
    name: "Mangan / Chungthang Gorge",
    state: "Sikkim",
    region: "Teesta River Upper Basin",
    coordinates: [88.5284, 27.5042],
    elevation_m: 1310,
    slope_deg: 34.8,
    catchment_area_sqkm: 210.5,
    historical_flood_frequency: 8.0,
    baseline: {
      rainfall_1h: 18.0,
      rainfall_3h: 46.0,
      rainfall_6h: 82.0,
      rainfall_24h: 160.0,
      antecedent_rain_3d: 210.0,
      antecedent_rain_7d: 320.0,
      soil_moisture: 0.85
    },
    safe_zones: [
      { name: "Mangan District Administrative Ridge", coordinates: [88.5340, 27.5110], elevation_m: 1490, type: "Stabilized Crest" }
    ],
    catchment_nodes: [
      { id: "mgn-lhonak", name: "South Lhonak Glacial Lake Sector", coordinates: [88.2100, 27.9100], elevation_m: 5200, slope_deg: 38.0, role: "Glacial Lake Outflow Head" },
      { id: "mgn-chungthang", name: "Chungthang Confluence Hub", coordinates: [88.6470, 27.6030], elevation_m: 1700, slope_deg: 30.0, role: "Lachen-Lachung River Meeting" }
    ]
  },
  {
    id: "kullu",
    name: "Kullu - Manali Valley",
    state: "Himachal Pradesh",
    region: "Upper Beas Catchment",
    coordinates: [77.1095, 31.9579],
    elevation_m: 1279,
    slope_deg: 28.2,
    catchment_area_sqkm: 345.0,
    historical_flood_frequency: 6.9,
    baseline: {
      rainfall_1h: 9.5,
      rainfall_3h: 26.0,
      rainfall_6h: 49.0,
      rainfall_24h: 92.0,
      antecedent_rain_3d: 110.0,
      antecedent_rain_7d: 165.0,
      soil_moisture: 0.69
    },
    safe_zones: [
      { name: "Sultanpur High Ground Assembly", coordinates: [77.1150, 31.9640], elevation_m: 1360, type: "Elevated Municipal Ground" }
    ],
    catchment_nodes: [
      { id: "klu-solang", name: "Solang Valley Upper Stream", coordinates: [77.1500, 32.3160], elevation_m: 2480, slope_deg: 35.0, role: "Glacial & Storm Runoff Accumulation" },
      { id: "klu-manali", name: "Manali Old Town Fluvial Channel", coordinates: [77.1887, 32.2432], elevation_m: 2050, slope_deg: 22.0, role: "River Bank Commercial Core" }
    ]
  },
  {
    id: "wayanad",
    name: "Wayanad (Meppadi / Chooralmala)",
    state: "Kerala",
    region: "Western Ghats Escarpment - Chaliyar Sub-basin",
    coordinates: [76.1320, 11.5360],
    elevation_m: 920,
    slope_deg: 31.5,
    catchment_area_sqkm: 88.2,
    historical_flood_frequency: 9.1,
    baseline: {
      rainfall_1h: 22.0,
      rainfall_3h: 62.0,
      rainfall_6h: 118.0,
      rainfall_24h: 240.0,
      antecedent_rain_3d: 360.0,
      antecedent_rain_7d: 510.0,
      soil_moisture: 0.94
    },
    safe_zones: [
      { name: "Meppadi Community High School Center", coordinates: [76.1210, 11.5510], elevation_m: 1050, type: "Elevated Public Shelter" }
    ],
    catchment_nodes: [
      { id: "wyd-punchirimattom", name: "Punchirimattom Ridge Headwall", coordinates: [76.1600, 11.5180], elevation_m: 1450, slope_deg: 42.0, role: "Extreme Runoff & Landslide Initiation" },
      { id: "wyd-chooralmala", name: "Chooralmala Bridge & Market", coordinates: [76.1320, 11.5360], elevation_m: 880, slope_deg: 18.0, role: "River Fluvial Choke Node" }
    ]
  },
  {
    id: "dharamshala",
    name: "Dharamshala / Kangra Slopes",
    state: "Himachal Pradesh",
    region: "Dhauladhar Escarpment - Beas Tributary",
    coordinates: [76.3234, 32.2190],
    elevation_m: 1457,
    slope_deg: 26.5,
    catchment_area_sqkm: 115.0,
    historical_flood_frequency: 7.2,
    baseline: {
      rainfall_1h: 11.0,
      rainfall_3h: 31.0,
      rainfall_6h: 55.0,
      rainfall_24h: 105.0,
      antecedent_rain_3d: 130.0,
      antecedent_rain_7d: 190.0,
      soil_moisture: 0.72
    },
    safe_zones: [
      { name: "Dharamshala Stadium High Terrace", coordinates: [76.3260, 32.1980], elevation_m: 1475, type: "Reinforced Sports Complex Ground" }
    ],
    catchment_nodes: [
      { id: "dhm-triund", name: "Triund Upper Catchment", coordinates: [76.3550, 32.2570], elevation_m: 2840, slope_deg: 37.0, role: "Orographic Storm Precipitation Inflow" },
      { id: "dhm-kotwali", name: "Kotwali Lower Bazaar", coordinates: [76.3234, 32.2190], elevation_m: 1390, slope_deg: 16.0, role: "Urban Flash Flood Confluence" }
    ]
  }
];

// Fallback risk calculation if AI engine is temporarily unreachable
function calculateLocalFallbackPrediction(body: any) {
  const r1h = Number(body.rainfall_1h || 12);
  const r3h = Number(body.rainfall_3h || r1h * 1.8);
  const r24h = Number(body.rainfall_24h || r3h * 2.2);
  const ant7d = Number(body.antecedent_rain_7d || r24h * 1.8);
  const soilMoisture = Number(body.soil_moisture > 1 ? body.soil_moisture / 100 : body.soil_moisture || 0.75);
  const slope = Number(body.slope || 30);
  const histFreq = Number(body.historical_flood_frequency || 7.5);

  const rainScore = Math.min(1.0, r1h / 50.0) * 0.40 + Math.min(1.0, r3h / 100.0) * 0.25 + Math.min(1.0, r24h / 240.0) * 0.20;
  const satScore = Math.pow(soilMoisture, 1.6) * 0.65 + Math.min(1.0, ant7d / 350.0) * 0.35;
  const slopeScore = Math.min(1.0, slope / 42.0);
  const histScore = Math.min(1.0, histFreq / 10.0);

  const surge = (soilMoisture > 0.80 && r1h > 30.0) ? 0.22 : (soilMoisture > 0.70 && r3h > 60.0 ? 0.15 : 0.0);
  const raw = rainScore * 0.42 + satScore * 0.28 + slopeScore * 0.18 + histScore * 0.12 + surge;
  const prob = 1.0 / (1.0 + Math.exp(-6.8 * (raw - 0.45)));
  const probability = Math.min(0.99, Math.max(0.02, Math.round(prob * 1000) / 1000));

  let risk_level = 'SAFE';
  let color = '#22c55e';
  let recommended_action = 'Normal catchment flow. Standard continuous monitoring.';
  if (probability >= 0.80) {
    risk_level = 'IMMEDIATE';
    color = '#ef4444';
    recommended_action = 'URGENT DANGER: Catastrophic flash flood surge imminent. Immediate evacuation to elevated terrain.';
  } else if (probability >= 0.60) {
    risk_level = 'EVACUATE SOON';
    color = '#f97316';
    recommended_action = 'High flash flood potential. Upstream runoff accelerating rapidly. Begin orderly evacuation.';
  } else if (probability >= 0.30) {
    risk_level = 'WATCH';
    color = '#eab308';
    recommended_action = 'Elevated runoff warning. Waterlogged soil matrix. Prohibit entry into low riverbeds.';
  }

  const top_factors: string[] = [];
  if (r1h >= 40) top_factors.push(`Cloudburst-scale 1h rainfall intensity (${r1h.toFixed(1)} mm/h)`);
  else if (r1h >= 20) top_factors.push(`Heavy 1h rainfall (${r1h.toFixed(1)} mm/h) accelerating discharge`);
  if (soilMoisture >= 0.85) top_factors.push(`Saturated soil matrix (${(soilMoisture * 100).toFixed(0)}%) converting rain directly to surface runoff`);
  if (slope >= 30) top_factors.push(`Steep mountain gradient (${slope.toFixed(1)}°) shortening concentration time`);
  if (ant7d >= 200) top_factors.push(`High 7-day antecedent precipitation (${ant7d.toFixed(0)} mm)`);
  if (top_factors.length === 0) top_factors.push('Catchment parameters within baseline retention thresholds');

  const lead_time_hours = probability >= 0.85 ? 1.0 : probability >= 0.60 ? 3.0 : probability >= 0.30 ? 8.0 : 24.0;
  const lead_time_label = probability >= 0.85 ? '45 - 60 minutes' : probability >= 0.60 ? '2.5 - 4 hours' : '> 8 hours';

  return {
    risk_probability: probability,
    risk_probability_percentage: Math.round(probability * 1000) / 10,
    risk_level,
    color,
    confidence: 0.88,
    lead_time_hours,
    lead_time_label,
    recommended_action,
    top_factors: top_factors.slice(0, 4),
    environmental_snapshot: {
      rainfall_1h: r1h,
      rainfall_3h: r3h,
      rainfall_24h: r24h,
      antecedent_rain_7d: ant7d,
      soil_moisture: soilMoisture,
      soil_moisture_percentage: Math.round(soilMoisture * 100),
      slope
    },
    fallback_mode: true,
    timestamp: new Date().toISOString()
  };
}

// 1. POST /api/flood/predict
router.post('/predict', async (req, res) => {
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/flood/predict`, req.body, { timeout: TIMEOUT_MS });
    return res.json(response.data);
  } catch (error) {
    console.warn('[Flood Router] AI Engine unreachable or error. Serving resilient local fallback prediction.');
    const fallback = calculateLocalFallbackPrediction(req.body);
    return res.json(fallback);
  }
});

// 2. GET /api/flood/risk-map
router.get('/risk-map', async (req, res) => {
  const locationId = (req.query.location_id as string) || 'kedarnath';
  try {
    const response = await axios.get(`${AI_ENGINE_URL}/flood/risk-map`, {
      params: { location_id: locationId },
      timeout: TIMEOUT_MS
    });
    return res.json(response.data);
  } catch (error) {
    console.warn('[Flood Router] AI Engine unreachable for risk-map. Serving local location map nodes.');
    const loc = LOCAL_LOCATIONS.find(l => l.id === locationId) || LOCAL_LOCATIONS[0];
    const pred = calculateLocalFallbackPrediction(loc.baseline);
    return res.json({
      location_id: loc.id,
      location_name: loc.name,
      center: loc.coordinates,
      overall_prediction: pred,
      catchment_nodes: loc.catchment_nodes.map(n => ({
        ...n,
        risk_probability: pred.risk_probability,
        risk_level: pred.risk_level,
        color: pred.color
      })),
      safe_zones: loc.safe_zones,
      geographic_precision_note: "Defensible catchment hydrological nodes (500m - 2km resolution). Markers represent upstream inflow, gorge funnel, settlement core, and safe refuge."
    });
  }
});

// 3. GET /api/flood/locations
router.get('/locations', async (req, res) => {
  try {
    const response = await axios.get(`${AI_ENGINE_URL}/flood/locations`, { params: req.query, timeout: TIMEOUT_MS });
    return res.json(response.data);
  } catch (error) {
    console.warn('[Flood Router] AI Engine unreachable for locations. Serving local demo locations.');
    const country = req.query.country as string;
    if (country) {
      const filtered = LOCAL_LOCATIONS.filter((l: any) => (l.country_code || 'IN').toUpperCase() === country.toUpperCase());
      if (filtered.length > 0) return res.json(filtered);
    }
    return res.json(LOCAL_LOCATIONS);
  }
});

// 4. GET /api/flood/history
router.get('/history', async (req, res) => {
  try {
    const response = await axios.get(`${AI_ENGINE_URL}/flood/history`, { params: req.query, timeout: TIMEOUT_MS });
    return res.json(response.data);
  } catch (error) {
    console.warn('[Flood Router] AI Engine unreachable for history. Serving embedded events.');
    return res.json([
      { id: "kedarnath-2013", name: "Kedarnath Disaster (2013)", country_code: "IN", location_name: "Kedarnath, Uttarakhand", date: "June 16-17, 2013" },
      { id: "chamoli-2021", name: "Chamoli Flash Flood (2021)", country_code: "IN", location_name: "Joshimath / Raini, Uttarakhand", date: "February 7, 2021" },
      { id: "mangan-2023", name: "Sikkim Teesta GLOF (2023)", country_code: "IN", location_name: "Chungthang / Mangan, Sikkim", date: "October 4, 2023" },
      { id: "wayanad-2024", name: "Wayanad Debris & Flash Flood (2024)", country_code: "IN", location_name: "Chooralmala / Mundakkai, Kerala", date: "July 30, 2024" }
    ]);
  }
});

// 5. GET /api/flood/history/:eventId
router.get('/history/:eventId', async (req, res) => {
  const { eventId } = req.params;
  try {
    const response = await axios.get(`${AI_ENGINE_URL}/flood/history/${eventId}`, { timeout: TIMEOUT_MS });
    return res.json(response.data);
  } catch (error) {
    console.warn(`[Flood Router] AI Engine unreachable for history event ${eventId}.`);
    return res.status(404).json({ error: "Event details temporarily unavailable from AI engine" });
  }
});

// 6. GET /api/flood/model-info
router.get('/model-info', async (req, res) => {
  try {
    const response = await axios.get(`${AI_ENGINE_URL}/flood/model-info`, { timeout: TIMEOUT_MS });
    return res.json(response.data);
  } catch (error) {
    return res.json({
      model_name: "CrisisIQ Random Forest Flash-Flood Classifier",
      algorithm: "RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)",
      validation_method: "Temporal Train/Test Split (80% Train, 20% Out-of-Time Test)",
      metrics: {
        precision: 0.654,
        recall: 0.692,
        f1_score: 0.672,
        roc_auc: 0.861,
        accuracy: 0.814
      },
      data_disclosure: "Trained and evaluated on a physically-informed synthetic mountain catchment dataset (5,000 samples). Metrics represent synthetic benchmark validation. Real-world deployment requires calibrated radar & AWS gauge assimilation."
    });
  }
});

// 7. POST /api/flood/trigger-alert: Connects flood prediction into CrisisIQ response workflow!
router.post('/trigger-alert', async (req, res) => {
  try {
    const {
      location_id,
      location_name,
      risk_level,
      risk_probability,
      top_factors = [],
      coordinates = [79.0669, 30.7346],
      lead_time_label = "2-4 hours"
    } = req.body;

    const locName = location_name || location_id || "Mountain Catchment";
    const riskPct = Math.round((risk_probability || 0.8) * 100);
    const severity = risk_level === 'IMMEDIATE' ? 'critical' : risk_level === 'EVACUATE SOON' ? 'high' : 'medium';

    const alertData = {
      title: `🚨 FLASH FLOOD ALERT: ${locName} (${risk_level})`,
      description: `CrisisIQ Multi-Source Predictive Engine detected ${risk_level} flash-flood risk (${riskPct}% probability). Estimated surge lead-time: ${lead_time_label}. Drivers: ${top_factors.slice(0, 2).join('; ') || 'Extreme catchment precipitation and saturation'}. Immediate response protocols initiated.`,
      type: 'flood',
      severity,
      location: {
        type: 'Point',
        coordinates: coordinates,
        region: locName,
        country: 'India'
      },
      affectedRadius: risk_level === 'IMMEDIATE' ? 25 : 15,
      source: {
        type: 'ai-engine',
        reference: `crisisiq-flood-${Date.now()}`,
        confidence: 0.88
      },
      aiAnalysis: {
        riskScore: riskPct,
        riskLevel: risk_level,
        recommendations: [
          `Issue urgent ${risk_level} early warning to all administrative and SDRF units in ${locName}`,
          'Sound valley downstream sirens and initiate immediate high-ground evacuation',
          'Deploy emergency medical and mountain rescue teams to designated assembly points'
        ],
        evacuationRoutes: [
          { name: "Ridge Safe Haven Route", distanceKm: 1.8, estimatedWalkTimeMin: 25 }
        ]
      }
    };

    const savedAlert = await alertStore.save(alertData);

    // Broadcast live over Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.emit('alert:new', savedAlert);
      console.log(`[Flood Alert] Broadcasted CrisisIQ Alert: ${alertData.title}`);
    }

    return res.json({
      success: true,
      message: "CrisisIQ Early Warning Alert dispatched successfully",
      alert: savedAlert
    });
  } catch (err: any) {
    console.error('[Flood Alert] Error triggering alert:', err);
    return res.status(500).json({ error: 'Failed to dispatch CrisisIQ alert' });
  }
});

export { router as floodRouter };
