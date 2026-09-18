# 🛣️ RoadSense AI &mdash; Intelligent Pothole & Road Damage Detection System
### Automated Edge Vision Patrol & Smart PWD Road Maintenance Dispatch Portal

A high-tech, mission-critical Web Application built with **HTML5, CSS3, and JavaScript** featuring an ultra-attractive Cyber-Govtech aesthetic, real-time computer vision simulation, ESP32 vibration sensor telemetry, GPS geo-tagging, and government maintenance workflow management.

---

## 🚀 Key Features

### 1. 🎥 Vehicle AI Dashcam & Road Scanner (`RoadVision™ HUD`)
- **Simulated Highway Patrol Mode**: Animated 3D perspective asphalt highway with real-time moving lanes, road texture, and realistic passing potholes/cracks.
- **Live Camera / Smartphone Mode**: Switch seamlessly to your device's webcam or smartphone camera (`navigator.mediaDevices.getUserMedia`) for real-world road scanning.
- **Upload Road Media**: Upload road damage photos/videos for instant AI bounding box inference.
- **Real-Time AI Computer Vision Overlay**:
  - Target reticles and glowing neon bounding boxes (`[POTHOLE: SEVERE 96.4%]`, `[ALLIGATOR CRACK 89%]`, `[SUNKEN MANHOLE 94.8%]`).
  - Automated calculation of **Damage Severity**, **Estimated Depth (cm)**, and **Impact Surface Area (m²)**.
  - Audible HUD alert chime via standard **Web Audio API** (synthesized sound effects with zero external audio files).

### 2. ⚡ Hardware Telemetry & Vibration Sensor (`ESP32 + MPU-6050 + GPS`)
- **Z-Axis Vertical Impact Waveform (Chart.js)**: Live G-force vibration graph oscillating around 1.0G normal road travel.
- **Automated Bump Impact Detection**: When the vehicle hits a pothole or deep bump, Z-axis acceleration breaches the threshold (**> 2.50G**), triggering an emergency audible shock alert and auto-saving a geotagged snapshot to the PWD database!
- **Simulated GPS Stream**: Automatic waypoint progression across major high-traffic arterial roads (e.g. Anna Salai, OMR IT Corridor, GST Road, Koyambedu) displaying live Latitude, Longitude, Speed (km/h), Heading compass, and GNSS satellite lock (14 Fix 3D).
- **Manual "Simulate Bump / Trigger Log" Button**: Perfect for live demonstrations and testing.

### 3. 🗺️ Interactive GIS Road Damage Map (`Leaflet.js`)
- Dark-mode cartography with custom pulsating radar pins.
- Color-coded severity pins:
  - 🔴 **Critical (Severe Potholes & Sunken Manholes)**
  - 🟡 **Moderate (Fatigue & Alligator Cracking)**
  - 🔵 **Minor (Longitudinal & Surface Joint Fissures)**
  - 🟢 **Repaired & Restored**
- **Live Patrol Vehicle Tracking**: High-tech radar-sweep icon moving smoothly along the road network.
- Quick filter toggles: *All Incidents*, *Critical Only*, *Pending Repair*, *Repaired*.
- Interactive popups with one-click **"Inspect & Dispatch Work Order"** trigger.

### 4. 🏛️ Government PWD Maintenance Command Center
- **Real-time KPI Counters**:
  - Total Damages Logged
  - Critical Hazards Requiring Immediate Action
  - Pending Work Orders
  - Repaired & Restored Sections (with % completion rate)
  - Estimated Repair Budget (₹ INR)
- **Incident Inspection Drawer & Work Order Modal**:
  - Captured road snapshot photo with bounding box annotations.
  - Full telemetry telemetry sheet (Speed, G-force impact, confidence score, depth, coordinates).
  - **Contractor Dispatch Workflow**:
    - Assign maintenance division (e.g. *National Highways Division IV*, *Metro Water & Roads Corp*).
    - Status progression: `Reported` ➔ `Work Order Issued` ➔ `In Progress` ➔ `Repaired`.
- **Export & Audit Tools**:
  - One-click **CSV Report Download** for official records.
  - **Printable Dispatch Order** formatted cleanly for PWD work orders.

---

## 🛠️ System Architecture

```
Hardware Layer (Smartphone / ESP32 + MPU6050 Accelerometer + NEO-6M GPS)
                       │
                       ▼ (HTTP / WebSockets / Telemetry Stream)
┌─────────────────────────────────────────────────────────────┐
│                       RoadSense AI Portal                   │
│                                                             │
│   ┌─────────────────────┐       ┌───────────────────────┐   │
│   │   RoadVision HUD    │       │     Leaflet GIS       │   │
│   │  (AI Canvas Vision) │       │   (Damage Mapping)    │   │
│   └──────────┬──────────┘       └───────────┬───────────┘   │
│              │                              │               │
│              ▼                              ▼               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │             Incident Store & Dispatch DB            │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │       Government PWD Maintenance Dashboard          │   │
│   │    (Work Orders • Contractor Assignment • Audit)     │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 How to Run

1. Navigate to the project directory:
   ```
   C:\Users\Boopesh\.gemini\antigravity\scratch\pothole-damage-detection
   ```
2. Simply double-click [`index.html`](file:///C:/Users/Boopesh/.gemini/antigravity/scratch/pothole-damage-detection/index.html) in any modern web browser (Google Chrome, Microsoft Edge, Brave, Firefox).
3. (Optional) Run with any local server (e.g. VS Code Live Server or `python -m http.server 8000`).

---

## 🎨 Visual Design Aesthetics
- **Palette**: Obsidian Dark Base (`#030712`), Slate Glassmorphism cards with `backdrop-filter: blur(16px)`.
- **Accent Glows**: Electric Cyan (`#00f2fe`), Hazard Amber (`#f59e0b`), Emergency Red (`#ef4444`), Emerald Green (`#10b981`).
- **Typography**: Google Fonts *Orbitron* (HUD Display), *Inter* (UI), *JetBrains Mono* (Telemetry).
