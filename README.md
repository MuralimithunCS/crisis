# CrisisIQ: Intelligent Disaster Response & Flash-Flood Prediction Platform

> **Target Smart India Hackathon Problem Statement**:  
> **SIH26192**: *"Flash Flood Prediction System for Hilly Regions using Multi-Source Data"*  
> **Target Region**: Vulnerable Indian Mountain Catchments (Himalayas & Western Ghats)

CrisisIQ is an enterprise-grade AI infrastructure for emergency response coordination, automated hazard intelligence, and hyper-local flash flood prediction in mountainous catchments.

---

## 1. System Architecture

CrisisIQ operates as a unified distributed system comprised of three microservices:

```
CRISISIQ PLATFORM
│
├── 1. DISASTER RESPONSE & COORDINATION ENGINE
│   ├── Live GDACS Incident Ingestion & USGS Satellite Telemetry
│   ├── Interactive Geospatial Intelligence Map (Leaflet / OSM)
│   ├── Multi-Role Access Control (Citizen / Emergency Responder / Admin)
│   ├── Emergency SOS Broadcast & Dynamic Evacuation Route Generation
│   └── Multi-Hazard Simulation (Floods, Cyclones, Earthquakes, Wildfires)
│
└── 2. CRISISIQ FLASH-FLOOD PREDICTION ENGINE (SIH26192)
    ├── Multi-Source Environmental Fusion (Precipitation, Antecedent Index, Soil Moisture, Topography)
    ├── Hydrological Feature Engineering (1h/3h/6h/24h intensity, 3d/7d antecedent, TWI)
    ├── Machine Learning Prediction Pipeline (Random Forest Classifier, ROC-AUC: 0.861)
    ├── 4-Tier Risk Classification (SAFE, WATCH, EVACUATE SOON, IMMEDIATE)
    ├── "Why Is This Area At Risk?" Physical Explainability & Relative Impact Engine
    ├── Hyper-Local Catchment Geospatial Map (Catchment head, gorge funnel, settlement core, safe haven)
    ├── Historical Disaster Replay System (Kedarnath 2013, Chamoli 2021, Sikkim 2023, Wayanad 2024)
    ├── Interactive Cloudburst Simulation Engine (Real-time threshold stress-testing)
    └── CrisisIQ Response Integration (Common Alerting Protocol broadcast & automated evacuation dispatch)
```

---

## 2. Multi-Source Environmental Features

The predictive engine processes 11 key hydrological and geomorphic features:

| Feature Name | Type | Unit | Physical Significance |
|---|---|---|---|
| `rainfall_1h` | Float | mm/h | Short-duration high-intensity downpour (cloudburst detection threshold >= 50mm/h) |
| `rainfall_3h` | Float | mm | Critical catchment peak concentration threshold |
| `rainfall_6h` | Float | mm | Intermediate storm duration accumulation |
| `rainfall_24h` | Float | mm | Daily cumulative saturation index |
| `antecedent_rain_3d` | Float | mm | Short-term antecedent moisture buffer |
| `antecedent_rain_7d` | Float | mm | Multi-day catchment pre-saturation (governs direct runoff coefficient) |
| `soil_moisture` | Float | 0.0 - 1.0 | Subsurface pore water pressure index (saturation > 88% causes instant runoff) |
| `elevation` | Float | meters | Orographic condensation zone & glacial altitude |
| `slope` | Float | degrees | Gravitational hydraulic kinetic velocity (steep slopes >= 30° accelerate surging) |
| `aspect` | Float | degrees | Terrain orientation relative to incoming monsoon storm tracks |
| `historical_flood_frequency`| Float | 0 - 10 | Catchment geomorphic susceptibility index |

---

## 3. Model Architecture & Validation Disclosure

### Machine Learning Model
- **Algorithm**: `RandomForestClassifier` (100 estimators, max depth 12, balanced class weighting)
- **Validation Methodology**: Strict **Temporal Train/Test Split** (First 80% chronological samples for training, final 20% out-of-time samples for evaluation).

### Benchmark Evaluation Metrics
- **Precision**: `0.654` (~0.65)
- **Recall**: `0.692` (~0.69)
- **F1-Score**: `0.672` (~0.67)
- **ROC-AUC**: `0.861` (~0.86)
- **Accuracy**: `0.814` (~81.4%)

### Mandatory Scientific Data Disclosure
> [!IMPORTANT]
> **Data Honesty & Ethics**: The Random Forest classifier is trained and evaluated on a **physically-informed synthetic mountain catchment dataset (5,000 temporal samples)** generated using hydrological laws (IDF precipitation distribution, Antecedent Precipitation Index, and slope-runoff dynamics). 
> The reported metrics represent validation on this synthetic benchmark. They are **not claimed as real-world field validation**. Production deployment requires integration with calibrated Indian Meteorological Department (IMD) Doppler radars, Central Water Commission (CWC) automatic stream gauges, and NRSC/ISRO Bhuvan satellite telemetry.

---

## 4. Four-Tier Risk Classification Matrix

CrisisIQ classifies mountain flood hazards into four standardized, actionable tiers:

| Tier | Risk Probability | Action Code | Color | Operational Guidance |
|---|---|---|---|---|
| **SAFE** | `< 0.30` | `MONITOR` | 🟢 Green | Catchment within retention capacity; routine continuous monitoring. |
| **WATCH** | `0.30 - 0.59` | `ADVISORY` | 🟡 Yellow | Rising water table & streams; pre-alert downstream transit units & low-lying areas. |
| **EVACUATE SOON** | `0.60 - 0.79` | `WARNING` | 🟠 Orange | Accelerated runoff surge; prepare evacuation of vulnerable riverbed settlements. |
| **IMMEDIATE** | `>= 0.80` | `ALARM` | 🔴 Red | Critical flash flood surge imminent; sound klaxons & immediate retreat to elevated high ground. |

---

## 5. Getting Started & Running Locally

### Prerequisites
- **Node.js**: v20+
- **Python**: 3.11+
- Windows, Linux, or macOS

---

### Step 1: AI Engine (FastAPI)
```bash
cd ai-engine
# Optional: create and activate a virtual environment
# python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn src.main:app --port 8000 --reload
```
- Health Check: `http://localhost:8000/health`
- Swagger API Docs: `http://localhost:8000/docs`
- Flood Prediction Route: `http://localhost:8000/flood/locations`

---

### Step 2: Backend (Node/Express Server)
```bash
cd backend
npm install
npm run build
npm start
```
*Note: In development mode, run `npm run dev` to watch TypeScript source changes.*
- Server running on: `http://localhost:3001`
- Flood Proxy Route: `http://localhost:3001/api/flood/locations`
- Health Endpoint: `http://localhost:3001/health`

---

### Step 3: Frontend (React + Vite + Leaflet)
```bash
cd frontend
npm install
npm run dev
```
- Open in browser: `http://localhost:5173`

---

## 6. Guaranteed Demo Mode (Zero-Crash Fallback)

CrisisIQ incorporates a **dual-layer resilient architecture**:
1. **Backend Layer**: If the AI engine is temporarily unreachable, the Node backend seamlessly executes calibrated local hydrological fallbacks and returns complete responses.
2. **Frontend Layer**: If both the backend and AI engine are offline, the frontend's `floodApi` automatically engages embedded client-side fallback engines with pre-loaded demo locations and historical events.

**Result**: Zero blank screens, zero console crashes, zero undefined/NaN values during hackathon jury evaluation even without active internet access.

---

## 7. Supported Monitored Catchments (Demo Locations)

1. **Kedarnath Valley (Mandakini Basin, Uttarakhand)**: Elevation 3,583m | Slope 38.5° | Moraine & glacial till.
2. **Chamoli / Joshimath (Rishiganga Basin, Uttarakhand)**: Elevation 1,890m | Slope 32.0° | Steep rock chutes.
3. **Mangan / Chungthang (Teesta Basin, Sikkim)**: Elevation 1,310m | Slope 34.8° | Extreme monsoon & GLOF vulnerability.
4. **Kullu - Manali Valley (Upper Beas, Himachal Pradesh)**: Elevation 1,279m | Slope 28.2° | Alluvial floodplains.
5. **Wayanad - Chooralmala / Meppadi (Chaliyar Basin, Kerala)**: Elevation 920m | Slope 31.5° | Escarpment slope liquefaction.
6. **Dharamshala (Dhauladhar Slopes, Himachal Pradesh)**: Elevation 1,457m | Slope 26.5° | Orographic cloudburst zone.

---

## 8. Historical Event Replay Scenarios

CrisisIQ features multi-stage chronological timeline scrubbers for 4 major Indian mountain disasters:
1. **Kedarnath Cloudburst & Disaster (June 2013)**: 4-stage escalation from T-48h pre-monsoon accumulation to Chorabari moraine breach.
2. **Chamoli Rock-Ice Avalanche & Flash Surge (Feb 2021)**: Sudden velocity surge down Rishiganga valley.
3. **Sikkim Teesta GLOF & Flash Flood (Oct 2023)**: South Lhonak lake outburst combined with torrential cloudburst.
4. **Wayanad Debris & Flash Flood (July 2024)**: Chooralmala slope failure after 48-hour continuous monsoon downpour.

---

## 9. API Reference

### Flash Flood Prediction Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/flood/predict` | `POST` | Computes flash-flood risk probability, 4-tier classification, and physical explainability factors |
| `/api/flood/risk-map` | `GET` | Returns hyper-local catchment nodes, valley choke points, and safe high-ground refuges |
| `/api/flood/locations` | `GET` | Lists available Indian mountain catchment monitoring sites |
| `/api/flood/history` | `GET` | Retrieves historical mountain flash-flood disaster records |
| `/api/flood/history/:eventId` | `GET` | Returns chronological timeline steps and environmental progressions for a disaster |
| `/api/flood/model-info` | `GET` | Returns model architecture, feature importances, and validation disclosures |
| `/api/flood/trigger-alert` | `POST` | Dispatches official early warning to the CrisisIQ live incident stream & activates evacuation |

---

## 10. 3-Minute SIH Presentation Script (For Judges)

### 0:00 – 0:45: The Problem & Traditional System Failure
> *"Good morning, esteemed judges. Traditional disaster systems issue coarse, regional warnings like: 'Heavy rainfall expected in Uttarakhand'. But in steep mountain valleys, rain alone does not cause flash floods. It is the combination of **rainfall intensity**, **antecedent saturation**, **topographic slope**, and **funneling geography** that determines whether a community is safe or facing disaster.*
> *This is **CrisisIQ**, built for SIH26192."*

### 0:45 – 1:30: Multi-Source Fusion & Live Simulation
> *(Open CrisisIQ Dashboard → Click **Flash-Flood Engine (SIH)**)*
> *"Here, CrisisIQ monitors vulnerable Indian mountain catchments like **Kedarnath**, **Chamoli**, **Mangan**, and **Wayanad**. Under normal baseline conditions, our Random Forest model classifies Kedarnath as **SAFE**.*
> *Now let's simulate what happens during a cloudburst:*
> *(Click **Simulate Cloudburst** or drag 1h Rainfall to 70mm/h and Soil Moisture to 95%)*
> *Notice how our engine instantly recalculates: Risk escalates to **IMMEDIATE (0.99)** with an actionable lead time of **50 minutes**.*
> *Under 'Why is this area at risk?', our explainability engine pinpoints the exact physical drivers: 70mm/h cloudburst, saturated soil preventing infiltration, and a 38° slope accelerating runoff kinetic energy."*

### 1:30 – 2:15: Hyper-Local Risk Mapping & Evacuation Route
> *(Point to the Interactive Leaflet Map)*
> *"On the map, we do not present a generic point marker. We represent defensible hydrological catchment nodes: the upstream inflow head, the valley gorge choke point, and the settlement core. Because the risk is now IMMEDIATE, CrisisIQ dynamically computes and plots an evacuation polyline directing residents to the designated **Kedarnath Helipad High Ridge Safe Haven**, safe above the predicted flood crest."*

### 2:15 – 3:00: Historical Replay & Closed-Loop Response
> *(Click **Historical Disaster Replay** → Select **Wayanad (2024)**)*
> *"Judges, CrisisIQ also allows disaster authorities to replay real historical catastrophes. Stepping from T-48h to T-12h and T-0 shows how soil saturation and continuous rainfall progressively escalated the risk from WATCH to IMMEDIATE.*
> *(Click **Dispatch CrisisIQ Alert**)*
> *Finally, CrisisIQ is not an isolated ML demo. Clicking dispatch integrates this prediction into CrisisIQ's live emergency command center, broadcasting Common Alerting Protocol warnings to local administration and emergency squads.*
> *CrisisIQ bridges the gap from **DETECT → PREDICT → WARN → ACT → PROTECT**."*
