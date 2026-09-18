// AI Road Damage Computer Vision & Dashcam Simulator Engine
class RoadVisionScanner {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.video = null;
        this.activeMode = 'simulator'; // 'simulator' | 'webcam' | 'upload'
        this.isRunning = false;
        this.lastDetectionTime = 0;
        this.detectionCooldown = 4500; // ms between auto incident logs
        this.aiConfidenceThreshold = 75; // %
        this.autoLogToPwd = true;

        // Simulated Road State
        this.roadScrollOffset = 0;
        this.simulatedObstacles = [];
        this.detectionBoxes = [];

        // Stats
        this.scannedFrames = 0;
        this.potholesDetectedSession = 0;
    }

    init(canvasId, videoId) {
        this.canvas = document.getElementById(canvasId);
        this.video = document.getElementById(videoId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.start();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width || 800;
        this.canvas.height = rect.height || 480;
    }

    start() {
        this.isRunning = true;
        this.loop();
    }

    stop() {
        this.isRunning = false;
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    setMode(mode) {
        this.activeMode = mode;
        if (mode === 'webcam') {
            this.startWebcam();
        } else {
            if (this.video && this.video.srcObject) {
                this.video.srcObject.getTracks().forEach(t => t.stop());
                this.video.srcObject = null;
            }
        }
    }

    async startWebcam() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Webcam is not supported or accessible in this browser.");
            this.setMode('simulator');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            this.video.srcObject = stream;
            await this.video.play();
        } catch (err) {
            console.warn("Webcam access error:", err);
            alert("Unable to open camera: " + err.message + ". Returning to dashcam simulation mode.");
            this.setMode('simulator');
        }
    }

    loop() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.activeMode === 'simulator') {
            this.renderSimulatedDashcam();
        } else if (this.activeMode === 'webcam') {
            this.renderWebcamFeed();
        } else if (this.activeMode === 'upload') {
            this.renderUploadedImage();
        }

        // Draw HUD Overlays (Crosshairs, Compass, Diagnostics)
        this.renderHUD();

        this.scannedFrames++;
        requestAnimationFrame(() => this.loop());
    }

    renderSimulatedDashcam() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const horizon = h * 0.42;

        // 1. Sky & Ambient Horizon
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, horizon);
        skyGrad.addColorStop(0, '#020617');
        skyGrad.addColorStop(0.7, '#0f172a');
        skyGrad.addColorStop(1, '#1e293b');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, w, horizon);

        // Distant city skyline silhouette & road barrier
        this.ctx.fillStyle = '#090d16';
        this.ctx.fillRect(0, horizon - 15, w, 15);

        // 2. Road Asphalt Perspective Ground
        const roadGrad = this.ctx.createLinearGradient(0, horizon, 0, h);
        roadGrad.addColorStop(0, '#1a202c');
        roadGrad.addColorStop(1, '#0b0f19');
        this.ctx.fillStyle = roadGrad;
        this.ctx.fillRect(0, horizon, w, h - horizon);

        // 3. Perspective Road Borders & Kerbs
        const roadTopWidth = w * 0.28;
        const roadBottomWidth = w * 0.94;
        const centerX = w * 0.5;

        const leftTopX = centerX - roadTopWidth / 2;
        const rightTopX = centerX + roadTopWidth / 2;
        const leftBottomX = centerX - roadBottomWidth / 2;
        const rightBottomX = centerX + roadBottomWidth / 2;

        // Road Surface Polygon
        this.ctx.beginPath();
        this.ctx.moveTo(leftTopX, horizon);
        this.ctx.lineTo(rightTopX, horizon);
        this.ctx.lineTo(rightBottomX, h);
        this.ctx.lineTo(leftBottomX, h);
        this.ctx.closePath();
        this.ctx.fillStyle = '#181e2b';
        this.ctx.fill();

        // Edge Barrier Lines (Yellow hazard stripes)
        this.ctx.strokeStyle = '#eab308';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(leftTopX, horizon);
        this.ctx.lineTo(leftBottomX, h);
        this.ctx.moveTo(rightTopX, horizon);
        this.ctx.lineTo(rightBottomX, h);
        this.ctx.stroke();

        // Moving Dash Lanes
        const speed = (window.telemetry ? window.telemetry.currentSpeed : 45) * 0.18;
        this.roadScrollOffset = (this.roadScrollOffset + speed) % 100;

        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([25, 30]);
        this.ctx.lineDashOffset = -this.roadScrollOffset * 3;

        // Left Lane divider
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - roadTopWidth * 0.22, horizon);
        this.ctx.lineTo(centerX - roadBottomWidth * 0.22, h);
        this.ctx.stroke();

        // Right Lane divider
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + roadTopWidth * 0.22, horizon);
        this.ctx.lineTo(centerX + roadBottomWidth * 0.22, h);
        this.ctx.stroke();

        this.ctx.setLineDash([]); // Reset dash

        // 4. Update & Spawn Road Damage Obstacles
        this.updateSimulatedDamages(horizon, w, h);
    }

    updateSimulatedDamages(horizon, w, h) {
        // Periodically spawn road defects
        if (Math.random() < 0.012 && this.simulatedObstacles.length < 2) {
            const types = [
                { type: 'Pothole (Severe)', severity: 'critical', depth: 14.8, area: 1.8, zPeak: 3.9 },
                { type: 'Alligator Cracks', severity: 'moderate', depth: 4.2, area: 3.1, zPeak: 2.3 },
                { type: 'Deep Depression', severity: 'critical', depth: 12.0, area: 1.4, zPeak: 3.4 },
                { type: 'Surface Wear / Crack', severity: 'minor', depth: 2.8, area: 1.9, zPeak: 1.6 }
            ];
            const chosen = types[Math.floor(Math.random() * types.length)];
            const laneOffset = (Math.random() - 0.5) * 0.6; // -0.3 to +0.3

            this.simulatedObstacles.push({
                ...chosen,
                zProgress: 0.05, // 0 = horizon, 1 = camera bumper
                laneOffset: laneOffset,
                detected: false
            });
        }

        const now = Date.now();

        // Process each obstacle moving towards vehicle
        for (let i = this.simulatedObstacles.length - 1; i >= 0; i--) {
            const obs = this.simulatedObstacles[i];
            const speedFactor = (window.telemetry ? window.telemetry.currentSpeed : 45) * 0.00022;
            obs.zProgress += speedFactor;

            // Calculate perspective size & position
            const roadWidthAtY = (w * 0.28) + (w * 0.66) * obs.zProgress;
            const y = horizon + (h - horizon) * Math.pow(obs.zProgress, 1.6);
            const x = (w * 0.5) + (roadWidthAtY * obs.laneOffset);

            const scale = Math.pow(obs.zProgress, 1.8);
            const boxW = Math.max(30, 200 * scale);
            const boxH = Math.max(15, 100 * scale);

            // Render physical defect on asphalt
            this.drawRoadDefectGraphic(x, y, boxW, boxH, obs.type, obs.severity);

            // AI Vision Detection Trigger Window (when obstacle enters focus zone)
            if (obs.zProgress >= 0.35 && obs.zProgress <= 0.85) {
                // Draw AI Bounding Box
                this.drawAIBoundingBox(x - boxW/2, y - boxH/2, boxW, boxH, obs);

                if (!obs.detected && (now - this.lastDetectionTime > this.detectionCooldown)) {
                    obs.detected = true;
                    this.lastDetectionTime = now;
                    this.handlePotholeFound(obs, x, y);
                }
            }

            // Remove when passed camera bumper
            if (obs.zProgress >= 1.05) {
                // If it was a deep pothole, trigger vehicle shock bounce right as it passes the wheels!
                if (obs.severity === 'critical') {
                    if (window.telemetry) window.telemetry.triggerBump(obs.zPeak);
                }
                this.simulatedObstacles.splice(i, 1);
            }
        }
    }

    drawRoadDefectGraphic(cx, cy, bw, bh, type, severity) {
        this.ctx.save();
        this.ctx.translate(cx, cy);

        // Crater shadow
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, bw * 0.5, bh * 0.4, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#06090e';
        this.ctx.fill();

        // Inner crater texture
        if (type.includes('Pothole') || type.includes('Depression')) {
            this.ctx.beginPath();
            this.ctx.ellipse(bw * 0.05, bh * 0.08, bw * 0.35, bh * 0.25, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = '#000000';
            this.ctx.fill();

            // Broken asphalt rubble highlights
            this.ctx.strokeStyle = '#475569';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(-bw * 0.2, bh * 0.1, 4, 0, Math.PI);
            this.ctx.arc(bw * 0.15, -bh * 0.1, 5, 0, Math.PI);
            this.ctx.stroke();
        } else {
            // Crack lines
            this.ctx.strokeStyle = '#1e293b';
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-bw * 0.4, 0);
            this.ctx.lineTo(-bw * 0.1, bh * 0.2);
            this.ctx.lineTo(bw * 0.1, -bh * 0.2);
            this.ctx.lineTo(bw * 0.4, bh * 0.1);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawAIBoundingBox(bx, by, bw, bh, item) {
        const conf = item.confidence || (92.4 + Math.random() * 5).toFixed(1);
        const color = item.severity === 'critical' ? '#ef4444' : item.severity === 'moderate' ? '#f59e0b' : '#38bdf8';

        this.ctx.save();
        // Bounding Box Frame
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(bx, by, bw, bh);

        // High-tech Corner Accents
        const cornerLen = Math.min(14, bw * 0.2);
        this.ctx.lineWidth = 3.5;
        this.ctx.beginPath();
        // Top-Left
        this.ctx.moveTo(bx, by + cornerLen); this.ctx.lineTo(bx, by); this.ctx.lineTo(bx + cornerLen, by);
        // Top-Right
        this.ctx.moveTo(bx + bw - cornerLen, by); this.ctx.lineTo(bx + bw, by); this.ctx.lineTo(bx + bw, by + cornerLen);
        // Bottom-Left
        this.ctx.moveTo(bx, by + bh - cornerLen); this.ctx.lineTo(bx, by + bh); this.ctx.lineTo(bx + cornerLen, by + bh);
        // Bottom-Right
        this.ctx.moveTo(bx + bw - cornerLen, by + bh); this.ctx.lineTo(bx + bw, by + bh); this.ctx.lineTo(bx + bw, by + bh - cornerLen);
        this.ctx.stroke();

        // Target Reticle Center
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(bx + bw/2, by + bh/2, 6, 0, Math.PI * 2);
        this.ctx.stroke();

        // Label Badge
        const tagText = `${item.type.toUpperCase()} [${conf}%]`;
        this.ctx.font = 'bold 11px monospace';
        const tagW = this.ctx.measureText(tagText).width + 12;
        const tagH = 20;

        this.ctx.fillStyle = color;
        this.ctx.fillRect(bx, by - tagH, tagW, tagH);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(tagText, bx + 6, by - 6);

        // Sub-metric Badge: Depth & Area
        const metrics = `EST. DEPTH: ${item.depth || 12.0}cm | AREA: ${item.area || 1.6}m²`;
        this.ctx.font = '9px monospace';
        const mW = this.ctx.measureText(metrics).width + 10;
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        this.ctx.fillRect(bx, by + bh + 2, mW, 16);
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillText(metrics, bx + 5, by + bh + 14);

        this.ctx.restore();
    }

    renderWebcamFeed() {
        if (!this.video || this.video.readyState < 2) {
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.font = '14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CONNECTING TO ON-BOARD CAMERA FEED...', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }

        // Draw camera video frame to canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        // Run continuous real-time synthetic detection box tracking center road
        const cx = this.canvas.width * 0.5;
        const cy = this.canvas.height * 0.65;
        const w = this.canvas.width * 0.35;
        const h = this.canvas.height * 0.25;

        const liveDefect = {
            type: 'Surface Crack / Road Wear',
            severity: 'moderate',
            confidence: (86.5 + Math.sin(Date.now() * 0.003) * 6).toFixed(1),
            depth: 5.4,
            area: 1.2
        };
        this.drawAIBoundingBox(cx - w/2, cy - h/2, w, h, liveDefect);
    }

    renderUploadedImage() {
        if (this.uploadedImg) {
            this.ctx.drawImage(this.uploadedImg, 0, 0, this.canvas.width, this.canvas.height);
            if (this.uploadedBoxes) {
                this.uploadedBoxes.forEach(b => {
                    this.drawAIBoundingBox(b.x, b.y, b.w, b.h, b);
                });
            }
        }
    }

    handlePotholeFound(obstacle, x, y) {
        this.potholesDetectedSession++;
        
        // Play audio alert
        if (window.soundFX) {
            window.soundFX.playDetectionAlert(obstacle.severity);
        }

        // Flash HUD Indicator
        const alertIndicator = document.getElementById('ai-hazard-alert');
        if (alertIndicator) {
            alertIndicator.classList.remove('hidden');
            alertIndicator.innerHTML = `⚠️ <b>${obstacle.type.toUpperCase()} DETECTED</b> &mdash; CONF: 96%`;
            setTimeout(() => alertIndicator.classList.add('hidden'), 3200);
        }

        // Capture snapshot from canvas
        let snapshotDataUrl = '';
        try {
            snapshotDataUrl = this.canvas.toDataURL('image/jpeg', 0.8);
        } catch (e) {
            snapshotDataUrl = generateDamageThumbnail(obstacle.type, obstacle.severity);
        }

        // Prepare new incident object
        const tel = window.telemetry || { currentLat: 13.042, currentLng: 80.245, currentSpeed: 45, currentRoad: 'Anna Salai' };
        const newIncident = {
            id: `RD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            type: obstacle.type,
            severity: obstacle.severity,
            status: 'reported',
            roadName: tel.currentRoad || "Patrol Arterial Expressway",
            city: "Chennai",
            lat: Number(tel.currentLat.toFixed(5)),
            lng: Number(tel.currentLng.toFixed(5)),
            depthCm: obstacle.depth || 11.5,
            areaSqM: obstacle.area || 1.8,
            confidence: Number((93.5 + Math.random() * 5).toFixed(1)),
            zPeakG: obstacle.zPeak || 3.4,
            speedKmh: tel.currentSpeed || 45,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            vehicleId: "TN-01-PV-4092",
            contractor: "Unassigned",
            estimatedCost: obstacle.severity === 'critical' ? 9500 : 4800,
            notes: `Auto-flagged by RoadSense AI Edge Vision during automated highway patrol scan.`,
            snapshotUrl: snapshotDataUrl,
            snapshotType: 'pothole_deep'
        };

        if (this.autoLogToPwd && window.incidentStore) {
            window.incidentStore.add(newIncident);

            // Notify UI & Map
            const event = new CustomEvent('new-incident-logged', { detail: newIncident });
            window.dispatchEvent(event);
        }
    }

    renderHUD() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.save();

        // 1. Scanner Crosshair Reticle Center
        const cx = w / 2;
        const cy = h / 2;
        this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.moveTo(cx - 24, cy); this.ctx.lineTo(cx + 24, cy);
        this.ctx.moveTo(cx, cy - 24); this.ctx.lineTo(cx, cy + 24);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        this.ctx.stroke();

        // 2. Corner Bracket HUD Frame
        const pad = 16;
        const bracketLen = 22;
        this.ctx.strokeStyle = '#00f2fe';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        // Top-left
        this.ctx.moveTo(pad, pad + bracketLen); this.ctx.lineTo(pad, pad); this.ctx.lineTo(pad + bracketLen, pad);
        // Top-right
        this.ctx.moveTo(w - pad - bracketLen, pad); this.ctx.lineTo(w - pad, pad); this.ctx.lineTo(w - pad, pad + bracketLen);
        // Bottom-left
        this.ctx.moveTo(pad, h - pad - bracketLen); this.ctx.lineTo(pad, h - pad); this.ctx.lineTo(pad + bracketLen, h - pad);
        // Bottom-right
        this.ctx.moveTo(w - pad - bracketLen, h - pad); this.ctx.lineTo(w - pad, h - pad); this.ctx.lineTo(w - pad, h - pad - bracketLen);
        this.ctx.stroke();

        // 3. Top HUD Status Bar
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
        this.ctx.fillRect(pad + 10, pad + 6, 240, 22);
        this.ctx.fillStyle = '#00f5a0';
        this.ctx.beginPath();
        this.ctx.arc(pad + 20, pad + 17, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.font = 'bold 10px monospace';
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.fillText(`AI INFERENCE ACTIVE | 45 FPS`, pad + 32, pad + 20);

        // 4. Optical Speed & Scanner Telemetry Overlay
        const speed = window.telemetry ? window.telemetry.currentSpeed : 45;
        this.ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
        this.ctx.fillRect(w - pad - 190, pad + 6, 180, 22);
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.fillText(`VEHICLE SPD: ${speed} KM/H`, w - pad - 178, pad + 20);

        this.ctx.restore();
    }

    // Manual Bump/Pothole Trigger for interactive testing
    triggerManualDetection() {
        const demoObstacle = {
            type: 'Pothole (Severe)',
            severity: 'critical',
            depth: 15.4,
            area: 2.2,
            zPeak: 4.1,
            confidence: 98.2
        };
        if (window.telemetry) {
            window.telemetry.triggerBump(demoObstacle.zPeak);
        }
        this.handlePotholeFound(demoObstacle, this.canvas.width / 2, this.canvas.height * 0.7);
    }
}

window.roadScanner = new RoadVisionScanner();
