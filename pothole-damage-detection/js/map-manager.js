// Leaflet GIS Road Damage Map & Live Patrol Vehicle Tracking
class RoadMapManager {
    constructor() {
        this.map = null;
        this.markerLayer = null;
        this.patrolMarker = null;
        this.routePolyline = null;
        this.markersById = new Map();
        this.activeFilter = 'all';
    }

    init(containerId) {
        // Initial center around Chennai arterial corridor (13.042, 80.245)
        this.map = L.map(containerId, {
            center: [13.042, 80.235],
            zoom: 13,
            zoomControl: false
        });

        // Add top-right custom zoom control
        L.control.zoom({ position: 'topright' }).addTo(this.map);

        // High-tech dark CartoDB tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> | RoadSense AI Gov Portal',
            maxZoom: 19,
            subdomains: 'abcd'
        }).addTo(this.map);

        this.markerLayer = L.layerGroup().addTo(this.map);

        // Initialize Live Patrol Vehicle Marker
        this.initPatrolVehicle();

        // Load all existing incidents
        this.reloadMarkers();

        // Listen for real-time telemetry updates
        if (window.telemetry) {
            window.telemetry.onGpsUpdate(pos => {
                this.updatePatrolPosition(pos.lat, pos.lng, pos.heading);
            });
        }

        // Listen for new detected incidents
        window.addEventListener('new-incident-logged', (e) => {
            this.addIncidentMarker(e.detail, true);
        });
    }

    initPatrolVehicle() {
        const carIcon = L.divIcon({
            className: 'patrol-car-marker',
            html: `
                <div class="patrol-vehicle-radar">
                    <div class="radar-scan-cone"></div>
                    <div class="patrol-car-body">
                        <span class="car-dot"></span>
                        <span class="car-label">PATROL-01</span>
                    </div>
                </div>
            `,
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        });

        this.patrolMarker = L.marker([13.0067, 80.2030], { icon: carIcon }).addTo(this.map);
    }

    updatePatrolPosition(lat, lng, heading) {
        if (this.patrolMarker) {
            this.patrolMarker.setLatLng([lat, lng]);
            const cone = document.querySelector('.radar-scan-cone');
            if (cone) {
                cone.style.transform = `rotate(${heading}deg)`;
            }
        }
    }

    createMarkerIcon(incident) {
        const sev = incident.severity;
        const status = incident.status;
        let colorClass = 'critical-pin';
        let badgeColor = '#ef4444';
        let iconSymbol = '⚠️';

        if (status === 'repaired') {
            colorClass = 'repaired-pin';
            badgeColor = '#10b981';
            iconSymbol = '✓';
        } else if (sev === 'moderate') {
            colorClass = 'moderate-pin';
            badgeColor = '#f59e0b';
            iconSymbol = '⚡';
        } else if (sev === 'minor') {
            colorClass = 'minor-pin';
            badgeColor = '#38bdf8';
            iconSymbol = 'ℹ️';
        }

        return L.divIcon({
            className: `pothole-custom-pin ${colorClass}`,
            html: `
                <div class="pin-pulse-wrapper">
                    <span class="pin-ripple" style="border-color: ${badgeColor}"></span>
                    <div class="pin-badge" style="background: ${badgeColor}; box-shadow: 0 0 12px ${badgeColor}">
                        <span class="pin-icon">${iconSymbol}</span>
                    </div>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
    }

    addIncidentMarker(incident, panTo = false) {
        if (this.markersById.has(incident.id)) {
            // Remove existing marker
            this.markerLayer.removeLayer(this.markersById.get(incident.id));
        }

        const icon = this.createMarkerIcon(incident);
        const marker = L.marker([incident.lat, incident.lng], { icon: icon });

        // Popup Content with Glassmorphic styling
        const popupHtml = `
            <div class="map-popup-card">
                <div class="popup-header">
                    <span class="popup-badge ${incident.severity}">${incident.severity.toUpperCase()}</span>
                    <span class="popup-id">${incident.id}</span>
                </div>
                <h4 class="popup-road">${incident.roadName}</h4>
                <div class="popup-stats-grid">
                    <div>
                        <span class="p-lbl">EST. DEPTH</span>
                        <span class="p-val text-red">${incident.depthCm} cm</span>
                    </div>
                    <div>
                        <span class="p-lbl">IMPACT AREA</span>
                        <span class="p-val">${incident.areaSqM} m²</span>
                    </div>
                    <div>
                        <span class="p-lbl">AI CONFIDENCE</span>
                        <span class="p-val text-cyan">${incident.confidence}%</span>
                    </div>
                    <div>
                        <span class="p-lbl">STATUS</span>
                        <span class="p-val ${incident.status}">${incident.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                </div>
                <button class="popup-inspect-btn" onclick="window.app.openIncidentDetail('${incident.id}')">
                    Inspect & Dispatch Work Order &rarr;
                </button>
            </div>
        `;

        marker.bindPopup(popupHtml, { className: 'custom-dark-popup', maxWidth: 280 });
        this.markerLayer.addLayer(marker);
        this.markersById.set(incident.id, marker);

        if (panTo) {
            this.map.flyTo([incident.lat, incident.lng], 15, { duration: 1.2 });
            setTimeout(() => marker.openPopup(), 1300);
        }
    }

    reloadMarkers(filter = 'all') {
        this.activeFilter = filter;
        this.markerLayer.clearLayers();
        this.markersById.clear();

        if (!window.incidentStore) return;
        const all = window.incidentStore.getAll();

        all.forEach(inc => {
            if (filter === 'all') {
                this.addIncidentMarker(inc);
            } else if (filter === 'critical' && inc.severity === 'critical' && inc.status !== 'repaired') {
                this.addIncidentMarker(inc);
            } else if (filter === 'pending' && inc.status !== 'repaired') {
                this.addIncidentMarker(inc);
            } else if (filter === 'repaired' && inc.status === 'repaired') {
                this.addIncidentMarker(inc);
            }
        });
    }

    focusIncident(id) {
        const marker = this.markersById.get(id);
        const inc = window.incidentStore ? window.incidentStore.getById(id) : null;
        if (marker && inc) {
            this.map.flyTo([inc.lat, inc.lng], 16, { duration: 1.0 });
            marker.openPopup();
        }
    }
}

window.roadMap = new RoadMapManager();
