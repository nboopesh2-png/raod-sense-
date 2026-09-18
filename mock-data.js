// Seed Data & Incident Management Store for Road Damage Incidents
const INITIAL_INCIDENTS = [
    {
        id: "RD-2026-8812",
        type: "Pothole (Severe)",
        severity: "critical", // critical, moderate, minor
        status: "reported", // reported, work_order_issued, in_progress, repaired
        roadName: "Anna Salai (Near Gemini Flyover, Northbound)",
        city: "Chennai",
        lat: 13.0524,
        lng: 80.2508,
        depthCm: 14.2,
        areaSqM: 1.85,
        confidence: 96.4,
        zPeakG: 3.8,
        speedKmh: 42,
        timestamp: "2026-09-18 17:42:10",
        vehicleId: "TN-01-PV-4092",
        contractor: "National Highways Division IV",
        estimatedCost: 8500,
        notes: "Deep impact hazard in center lane. High risk of two-wheeler rim damage & accidents.",
        snapshotType: "pothole_deep"
    },
    {
        id: "RD-2026-8809",
        type: "Alligator Cracking",
        severity: "moderate",
        status: "work_order_issued",
        roadName: "OMR IT Corridor (Tidel Park Junction)",
        city: "Chennai",
        lat: 12.9892,
        lng: 80.2484,
        depthCm: 4.5,
        areaSqM: 3.40,
        confidence: 89.1,
        zPeakG: 2.1,
        speedKmh: 55,
        timestamp: "2026-09-18 16:15:30",
        vehicleId: "TN-07-PV-8120",
        contractor: "Corridor Infra Works Ltd",
        estimatedCost: 14200,
        notes: "Extensive alligator mesh pattern. Sub-base moisture penetration detected.",
        snapshotType: "crack_mesh"
    },
    {
        id: "RD-2026-8798",
        type: "Sunken Manhole",
        severity: "critical",
        status: "in_progress",
        roadName: "Poonamallee High Road (Near Metro Station)",
        city: "Chennai",
        lat: 13.0805,
        lng: 80.2312,
        depthCm: 11.0,
        areaSqM: 0.95,
        confidence: 94.8,
        zPeakG: 3.2,
        speedKmh: 38,
        timestamp: "2026-09-18 14:02:45",
        vehicleId: "TN-01-PV-4092",
        contractor: "Metro Water & Roads Corp",
        estimatedCost: 6500,
        notes: "Manhole rim recessed below asphalt level, sudden vertical drop.",
        snapshotType: "manhole_sunken"
    },
    {
        id: "RD-2026-8774",
        type: "Longitudinal Crack",
        severity: "minor",
        status: "reported",
        roadName: "Velachery Bypass Road (Opposite Grand Mall)",
        city: "Chennai",
        lat: 12.9815,
        lng: 80.2180,
        depthCm: 2.8,
        areaSqM: 2.10,
        confidence: 82.3,
        zPeakG: 1.4,
        speedKmh: 48,
        timestamp: "2026-09-18 11:28:18",
        vehicleId: "TN-07-PV-8120",
        contractor: "Unassigned",
        estimatedCost: 3800,
        notes: "Linear fissure along paving joint. Pre-monsoon bitumen sealing recommended.",
        snapshotType: "crack_linear"
    },
    {
        id: "RD-2026-8742",
        type: "Pothole (Medium)",
        severity: "moderate",
        status: "repaired",
        roadName: "GST Road (Guindy Kathipara Grade Separator)",
        city: "Chennai",
        lat: 13.0067,
        lng: 80.2030,
        depthCm: 6.5,
        areaSqM: 1.15,
        confidence: 91.7,
        zPeakG: 2.4,
        speedKmh: 50,
        timestamp: "2026-09-17 09:12:05",
        vehicleId: "TN-01-PV-4092",
        contractor: "State Highways Maintenance Dept",
        estimatedCost: 5200,
        notes: "Cold-mix asphalt patch completed. Surface level restored to standard grade.",
        snapshotType: "pothole_repaired"
    },
    {
        id: "RD-2026-8715",
        type: "Edge Drop-off / Shoulder Erosion",
        severity: "moderate",
        status: "work_order_issued",
        roadName: "East Coast Road (ECR - Thiruvanmiyur stretch)",
        city: "Chennai",
        lat: 12.9720,
        lng: 80.2590,
        depthCm: 8.0,
        areaSqM: 4.20,
        confidence: 88.5,
        zPeakG: 2.3,
        speedKmh: 62,
        timestamp: "2026-09-17 08:35:40",
        vehicleId: "TN-07-PV-8120",
        contractor: "Coastal Highway Task Force",
        estimatedCost: 18500,
        notes: "Shoulder erosion caused by heavy rain runoff. Edge stabilization needed.",
        snapshotType: "shoulder_erosion"
    },
    {
        id: "RD-2026-8690",
        type: "Pothole (Severe Cluster)",
        severity: "critical",
        status: "reported",
        roadName: "Inner Ring Road (Jawaharlal Nehru Salai, Koyambedu)",
        city: "Chennai",
        lat: 13.0694,
        lng: 80.1948,
        depthCm: 16.5,
        areaSqM: 2.90,
        confidence: 97.8,
        zPeakG: 4.2,
        speedKmh: 35,
        timestamp: "2026-09-18 18:05:22",
        vehicleId: "TN-01-PV-4092",
        contractor: "Unassigned",
        estimatedCost: 12500,
        notes: "Double crater cluster right after market entrance. Bus and freight traffic obstruction.",
        snapshotType: "pothole_deep"
    }
];

// Helper to generate dynamic SVG snapshots if real photos are simulated
function generateDamageThumbnail(type, severity) {
    const isDark = true;
    const accentColor = severity === 'critical' ? '#ef4444' : severity === 'moderate' ? '#f59e0b' : '#3b82f6';
    const tag = severity.toUpperCase();

    if (type === 'pothole_repaired') {
        return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%231e293b"/><path d="M20,120 L380,120" stroke="%23334155" stroke-width="4" stroke-dasharray="12,12"/><ellipse cx="200" cy="130" rx="90" ry="45" fill="%230f172a" stroke="%2310b981" stroke-width="3"/><text x="200" y="135" fill="%2310b981" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle">✓ REPAIRED PATCH (PWD VERIFIED)</text><rect x="15" y="15" width="110" height="24" rx="4" fill="%2310b981"/><text x="70" y="31" fill="%23ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">RESTORED</text></svg>`;
    }

    // Dynamic crater illustration
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><defs><radialGradient id="grad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%23020617"/><stop offset="70%" stop-color="%230f172a"/><stop offset="100%" stop-color="%231e293b"/></radialGradient></defs><rect width="400" height="240" fill="%23111827"/><path d="M0,80 Q200,60 400,80 L400,240 L0,240 Z" fill="%231f2937"/><ellipse cx="200" cy="140" rx="95" ry="50" fill="url(%23grad)" stroke="${encodeURIComponent(accentColor)}" stroke-width="3" stroke-dasharray="6,3"/><ellipse cx="205" cy="145" rx="55" ry="25" fill="%23000000"/><path d="M120,130 L100,110 M280,150 L310,170 M160,170 L140,195 M250,115 L280,95" stroke="${encodeURIComponent(accentColor)}" stroke-width="2"/><rect x="15" y="15" width="90" height="24" rx="4" fill="${encodeURIComponent(accentColor)}"/><text x="60" y="31" fill="%23ffffff" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${tag}</text><rect x="120" y="15" width="160" height="24" rx="4" fill="%23000000" opacity="0.6"/><text x="200" y="31" fill="%2338bdf8" font-family="monospace" font-size="11" text-anchor="middle">AI CONF: 95.4%</text><rect x="100" y="80" width="200" height="120" fill="none" stroke="${encodeURIComponent(accentColor)}" stroke-width="1.5" stroke-dasharray="4,4"/></svg>`;
}

// Persistent Store with LocalStorage fallback
class IncidentStore {
    constructor() {
        const cached = localStorage.getItem('roadsense_incidents');
        if (cached) {
            try {
                this.incidents = JSON.parse(cached);
            } catch (e) {
                this.incidents = [...INITIAL_INCIDENTS];
            }
        } else {
            this.incidents = [...INITIAL_INCIDENTS];
            this.save();
        }
    }

    getAll() {
        return this.incidents;
    }

    getById(id) {
        return this.incidents.find(i => i.id === id);
    }

    add(incident) {
        this.incidents.unshift(incident);
        this.save();
        return incident;
    }

    updateStatus(id, newStatus, extra = {}) {
        const item = this.getById(id);
        if (item) {
            item.status = newStatus;
            Object.assign(item, extra);
            this.save();
            return item;
        }
        return null;
    }

    save() {
        try {
            localStorage.setItem('roadsense_incidents', JSON.stringify(this.incidents));
        } catch (e) {
            console.error("Storage save failed", e);
        }
    }

    resetDefaults() {
        this.incidents = JSON.parse(JSON.stringify(INITIAL_INCIDENTS));
        this.save();
        return this.incidents;
    }
}

window.incidentStore = new IncidentStore();
