// Hardware Telemetry Simulator: ESP32 + GPS + MPU6050 Accelerometer / Vibration Sensor
class TelemetryManager {
    constructor() {
        this.chart = null;
        this.telemetryInterval = null;
        this.currentSpeed = 48; // km/h
        this.currentHeading = 34; // degrees
        this.currentAlt = 16.4; // meters
        this.vibrationThreshold = 2.5; // G-force threshold for bump detection
        this.historySize = 35;
        this.chartLabels = Array(this.historySize).fill('');
        this.zAxisData = Array(this.historySize).fill(1.0);
        this.xAxisData = Array(this.historySize).fill(0.0);
        this.yAxisData = Array(this.historySize).fill(0.0);
        
        // Chennai Route Waypoints for Realistic Patrol Simulation
        this.waypoints = [
            { name: "Anna Salai - Guindy Kathipara", lat: 13.0067, lng: 80.2030, speed: 52 },
            { name: "Anna Salai - Nandanam Junction", lat: 13.0289, lng: 80.2365, speed: 45 },
            { name: "Anna Salai - Gemini Flyover", lat: 13.0524, lng: 80.2508, speed: 40 },
            { name: "Poonamallee High Road - Central", lat: 13.0805, lng: 80.2312, speed: 38 },
            { name: "Jawaharlal Nehru Salai - Koyambedu", lat: 13.0694, lng: 80.1948, speed: 44 },
            { name: "OMR IT Expressway - Perungudi", lat: 12.9654, lng: 80.2452, speed: 58 },
            { name: "OMR IT Expressway - Tidel Park", lat: 12.9892, lng: 80.2484, speed: 50 },
            { name: "Velachery Bypass Road", lat: 12.9815, lng: 80.2180, speed: 42 }
        ];
        this.currentWaypointIndex = 0;
        this.progress = 0;

        this.currentLat = this.waypoints[0].lat;
        this.currentLng = this.waypoints[0].lng;
        this.currentRoad = this.waypoints[0].name;
        this.isBumpTriggered = false;
        this.isRealGpsActive = false;
        this.listeners = [];
    }

    initChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.chartLabels,
                datasets: [
                    {
                        label: 'Z-Axis (Vertical Impact)',
                        data: this.zAxisData,
                        borderColor: '#00f2fe',
                        backgroundColor: 'rgba(0, 242, 254, 0.1)',
                        borderWidth: 2,
                        tension: 0.35,
                        pointRadius: 0,
                        fill: true
                    },
                    {
                        label: 'Threshold (2.5G)',
                        data: Array(this.historySize).fill(this.vibrationThreshold),
                        borderColor: 'rgba(239, 68, 68, 0.7)',
                        borderDash: [5, 5],
                        borderWidth: 1.5,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: { display: false },
                    y: {
                        min: 0,
                        max: 5.0,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: 'monospace', size: 10 },
                            callback: value => value.toFixed(1) + 'G'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: { enabled: false }
                }
            }
        });

        this.startTelemetryLoop();
    }

    startTelemetryLoop() {
        if (this.telemetryInterval) clearInterval(this.telemetryInterval);

        this.telemetryInterval = setInterval(() => {
            this.updateHardwareReadings();
        }, 120);
    }

    updateHardwareReadings() {
        // Normal road micro-vibrations around 1.0G (Earth gravity)
        let zVal = 1.0 + (Math.random() - 0.5) * 0.28;
        let xVal = (Math.random() - 0.5) * 0.15;
        let yVal = (Math.random() - 0.5) * 0.15;

        // If bump is triggered
        if (this.isBumpTriggered) {
            zVal = 2.8 + Math.random() * 1.6; // High G shock (2.8G to 4.4G)
            xVal = (Math.random() - 0.5) * 0.8;
            this.isBumpTriggered = false; // Reset trigger
            this.handleThresholdBreach(zVal);
        }

        // Update arrays
        this.zAxisData.push(zVal);
        this.zAxisData.shift();

        if (this.chart) {
            this.chart.update('none');
        }

        // Update GPS progression if simulated
        if (!this.isRealGpsActive) {
            this.advanceSimulatedGps();
        }

        // Update UI elements
        this.updateTelemetryHUD(zVal);
    }

    advanceSimulatedGps() {
        this.progress += 0.006;
        if (this.progress >= 1.0) {
            this.progress = 0;
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
        }

        const start = this.waypoints[this.currentWaypointIndex];
        const nextIdx = (this.currentWaypointIndex + 1) % this.waypoints.length;
        const end = this.waypoints[nextIdx];

        this.currentLat = start.lat + (end.lat - start.lat) * this.progress;
        this.currentLng = start.lng + (end.lng - start.lng) * this.progress;
        this.currentRoad = start.name;

        // Small jitter in speed & heading
        this.currentSpeed = Math.round(start.speed + (Math.random() - 0.5) * 4);
        this.currentHeading = (this.currentHeading + 1) % 360;

        // Notify listeners (e.g. map marker)
        this.notifyListeners({
            lat: this.currentLat,
            lng: this.currentLng,
            speed: this.currentSpeed,
            heading: this.currentHeading,
            road: this.currentRoad
        });
    }

    triggerBump(customZ = null) {
        this.isBumpTriggered = true;
        if (window.soundFX) {
            window.soundFX.playBumpShock();
        }
    }

    handleThresholdBreach(peakG) {
        const peakFormatted = peakG.toFixed(2);
        
        // Notify UI of vibration spike
        const shockBadge = document.getElementById('shock-alert-indicator');
        if (shockBadge) {
            shockBadge.classList.remove('hidden');
            shockBadge.innerText = `SHOCK IMPACT: ${peakFormatted}G`;
            shockBadge.classList.add('animate-pulse-fast');
            setTimeout(() => {
                shockBadge.classList.add('hidden');
                shockBadge.classList.remove('animate-pulse-fast');
            }, 3000);
        }

        // Emit event so AI Scanner can capture and file incident if desired
        const event = new CustomEvent('pothole-shock-detected', {
            detail: {
                peakG: peakFormatted,
                lat: this.currentLat,
                lng: this.currentLng,
                speed: this.currentSpeed,
                road: this.currentRoad,
                timestamp: new Date().toISOString()
            }
        });
        window.dispatchEvent(event);
    }

    updateTelemetryHUD(currentZ) {
        const zEl = document.getElementById('hud-z-force');
        const speedEl = document.getElementById('hud-speed');
        const gpsEl = document.getElementById('hud-gps-coords');
        const roadEl = document.getElementById('hud-current-road');
        const satCountEl = document.getElementById('hud-sat-count');

        if (zEl) {
            zEl.innerText = `${currentZ.toFixed(2)} G`;
            if (currentZ >= this.vibrationThreshold) {
                zEl.style.color = '#ef4444';
            } else {
                zEl.style.color = '#00f2fe';
            }
        }
        if (speedEl) speedEl.innerText = `${this.currentSpeed} km/h`;
        if (gpsEl) gpsEl.innerText = `${this.currentLat.toFixed(4)}°N, ${this.currentLng.toFixed(4)}°E`;
        if (roadEl) roadEl.innerText = this.currentRoad;
        if (satCountEl) satCountEl.innerText = '14 FIX (3D)';
    }

    onGpsUpdate(cb) {
        this.listeners.push(cb);
    }

    notifyListeners(payload) {
        this.listeners.forEach(cb => cb(payload));
    }

    toggleRealGps(enable) {
        if (enable && navigator.geolocation) {
            this.isRealGpsActive = true;
            this.watchId = navigator.geolocation.watchPosition(
                pos => {
                    this.currentLat = pos.coords.latitude;
                    this.currentLng = pos.coords.longitude;
                    this.currentSpeed = Math.round((pos.coords.speed || 0) * 3.6);
                    this.currentRoad = "Live GPS Location";
                    this.notifyListeners({
                        lat: this.currentLat,
                        lng: this.currentLng,
                        speed: this.currentSpeed,
                        heading: this.currentHeading,
                        road: this.currentRoad
                    });
                },
                err => {
                    console.warn("GPS watch failed, falling back to simulated patrol:", err);
                    this.isRealGpsActive = false;
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
            );
        } else {
            this.isRealGpsActive = false;
            if (this.watchId) navigator.geolocation.clearWatch(this.watchId);
        }
    }
}

window.telemetry = new TelemetryManager();
