# CrisisIQ — AI-Powered Disaster Intelligence System

CrisisIQ is a modern, high-performance, and entirely frontend-driven disaster response dashboard built with React and Tailwind CSS. It is designed to track live global disasters, calculate localized proximity threats, map emergency evacuation routes, and algorithmically predict agricultural infrastructure damage using live telemetry.

## 🌟 Core Architecture & Features

### 1. Live Global Threat Ingestion
The system connects directly to the **GDACS (Global Disaster Alert and Coordination System)** live GeoJSON feed. Earthquakes, cyclones, floods, and volcano eruptions are parsed in real-time, categorized by severity (Red/Orange/Green), and visually rendered on the core interface.

### 2. Proximity & Geolocation Intelligence
CrisisIQ utilizes browser GPS and the **Haversine Formula** to mathematically calculate the exact distance (in km) between the user and every active global disaster. 
- The **Live Alert Feed** is automatically filtered to isolate local threats within a 2,000 km radius.
- Actively clicking a distant global marker forces it into your local feed for manual tracking.

### 3. AI Navigational Routing (Leaflet Maps)
The dashboard operates over a dynamic `React-Leaflet` engine. When a critical disaster (Red/Orange severity) is selected, the system:
1. Generates coordinates for a theoretical **Nearest Trauma Hospital** and **Safe Zone Evacuation Center**.
2. Renders dynamic Leaflet Polylines that physically draw emergency navigational routes from the disaster epicenter to safety.
3. Suppresses this aggressive AI routing automatically if the disaster is localized or deeply low-impact (Green).

### 4. Organic Agricultural Analytics
The system contains a heavily specialized **Agri-Diagnostics Modal**.
- It connects to the **OpenWeather API** to pull live temperature and humidity metrics for the exact lat/long of the disaster event.
- An algorithm uses these live weather parameters to dynamically shape the *Expected* baseline crop yields (e.g., if temperature spikes, expected wheat yields drop organically).
- The system then applies a mathematical **Disaster Risk Score** against the baseline to calculate the *Actual* survivable crop yield, visualized via responsive, animated `Recharts` bar graphs.

### 5. Multi-Role UI Gateway & Simulation
- **Marketing & Simulation Engine**: A stunning, custom glassmorphic landing page featuring a built-in interactive emergency scenario simulator (simulating floods, fires, cyclones).
- **RBAC Authentication**: The gateway protects the main Dashboard behind three clearance algorithms (**Citizen**, **Responder**, **Admin**). The selected user-role propagates deeply into the React state and reflects dynamically inside the Dashboard's UI configurations.

## 🛠️ Technology Stack
- **Framework:** React 18 / Vite
- **Styling:** Tailwind CSS v4 (Glassmorphic UI, Keyframe Animations, Backdrop Blurs)
- **Mapping Engine:** React-Leaflet
- **Data Visualization:** Recharts
- **Live APIs:** GDACS API, OpenWeather API, Browser Geolocation API
- **Icons:** React-Icons (FontAwesome)

## 🚀 Running the Project
1. Navigate to the `frontend` directory.
2. Run `npm install` to ensure modules are aligned.
3. Run `npm run dev` to boot the application.
4. Launch your browser at `http://localhost:5173`.
