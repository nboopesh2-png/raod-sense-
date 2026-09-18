// Master Application Controller & Government PWD Dashboard Logic
class RoadSenseApp {
    constructor() {
        this.activeView = 'scanner'; // scanner, map, dashboard, analytics
        this.selectedIncident = null;
        this.contractorsList = [
            "National Highways Division IV",
            "State Highways Maintenance Dept",
            "Metro Water & Roads Corp",
            "Corridor Infra Works Ltd",
            "Coastal Highway Task Force",
            "Smart City Paving Services"
        ];
    }

    init() {
        console.log("Initializing RoadSense AI Portal...");

        // Setup Tab Navigation
        this.setupNavigation();

        // Setup Hardware & Vision Modules
        if (window.telemetry) {
            window.telemetry.initChart('vibration-chart');
        }
        if (window.roadScanner) {
            window.roadScanner.init('dashcam-canvas', 'webcam-video');
        }
        if (window.roadMap) {
            window.roadMap.init('map-container');
        }

        // Setup UI Event Listeners
        this.setupEventListeners();

        // Initial render of incidents table & KPI counters
        this.refreshDashboardKPIs();
        this.renderIncidentsTable();

        // Listen for new incidents from AI scanner
        window.addEventListener('new-incident-logged', (e) => {
            this.handleNewIncident(e.detail);
        });

        // Initialize user interaction sound unlock
        document.body.addEventListener('click', () => {
            if (window.soundFX) window.soundFX.init();
        }, { once: true });
    }

    setupNavigation() {
        const navBtns = document.querySelectorAll('[data-view-target]');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetView = btn.getAttribute('data-view-target');
                this.switchView(targetView);
            });
        });
    }

    switchView(viewName) {
        this.activeView = viewName;
        if (window.soundFX) window.soundFX.playClick();

        // Update nav active classes
        document.querySelectorAll('[data-view-target]').forEach(b => {
            if (b.getAttribute('data-view-target') === viewName) {
                b.classList.add('nav-active');
            } else {
                b.classList.remove('nav-active');
            }
        });

        // Toggle view containers
        document.querySelectorAll('.app-view').forEach(v => {
            v.classList.add('hidden');
        });

        const activeContainer = document.getElementById(`view-${viewName}`);
        if (activeContainer) {
            activeContainer.classList.remove('hidden');
        }

        // Invalidate Leaflet map size if switching to map or dashboard
        if ((viewName === 'map' || viewName === 'dashboard') && window.roadMap && window.roadMap.map) {
            setTimeout(() => {
                window.roadMap.map.invalidateSize();
            }, 200);
        }
    }

    setupEventListeners() {
        // Mode Switchers on Scanner (Simulator / Webcam / Upload)
        const simBtn = document.getElementById('btn-mode-sim');
        const camBtn = document.getElementById('btn-mode-cam');
        const uploadBtn = document.getElementById('btn-mode-upload');
        const fileInput = document.getElementById('image-file-input');

        if (simBtn) {
            simBtn.addEventListener('click', () => {
                this.setScannerMode('simulator', [simBtn, camBtn, uploadBtn]);
            });
        }
        if (camBtn) {
            camBtn.addEventListener('click', () => {
                this.setScannerMode('webcam', [camBtn, simBtn, uploadBtn]);
            });
        }
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }

        // Manual Bump Trigger
        const bumpBtn = document.getElementById('btn-trigger-bump');
        if (bumpBtn) {
            bumpBtn.addEventListener('click', () => {
                if (window.roadScanner) window.roadScanner.triggerManualDetection();
            });
        }

        // Sound FX Toggle
        const soundToggleBtn = document.getElementById('btn-toggle-sound');
        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', () => {
                if (window.soundFX) {
                    window.soundFX.enabled = !window.soundFX.enabled;
                    soundToggleBtn.classList.toggle('text-emerald-400', window.soundFX.enabled);
                    soundToggleBtn.classList.toggle('text-slate-500', !window.soundFX.enabled);
                    this.showToast(window.soundFX.enabled ? "Sound FX: Enabled" : "Sound FX: Muted");
                }
            });
        }

        // Map Filter Buttons
        const mapFilterBtns = document.querySelectorAll('[data-map-filter]');
        mapFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                mapFilterBtns.forEach(b => b.classList.remove('filter-active'));
                btn.classList.add('filter-active');
                const filter = btn.getAttribute('data-map-filter');
                if (window.roadMap) window.roadMap.reloadMarkers(filter);
            });
        });

        // Table Search & Filter
        const searchInput = document.getElementById('search-incident-input');
        const severityFilter = document.getElementById('filter-table-severity');
        const statusFilter = document.getElementById('filter-table-status');

        if (searchInput) searchInput.addEventListener('input', () => this.renderIncidentsTable());
        if (severityFilter) severityFilter.addEventListener('change', () => this.renderIncidentsTable());
        if (statusFilter) statusFilter.addEventListener('change', () => this.renderIncidentsTable());

        // Export Report Buttons
        const btnExportCsv = document.getElementById('btn-export-csv');
        if (btnExportCsv) {
            btnExportCsv.addEventListener('click', () => this.exportCsvReport());
        }

        const btnPrintReport = document.getElementById('btn-print-report');
        if (btnPrintReport) {
            btnPrintReport.addEventListener('click', () => window.print());
        }

        // Reset Data to Defaults
        const btnReset = document.getElementById('btn-reset-data');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (confirm("Reset road incident database to seed data?")) {
                    if (window.incidentStore) window.incidentStore.resetDefaults();
                    this.refreshDashboardKPIs();
                    this.renderIncidentsTable();
                    if (window.roadMap) window.roadMap.reloadMarkers();
                    this.showToast("Incident database reset to defaults.");
                }
            });
        }
    }

    setScannerMode(mode, btnArray) {
        btnArray[0].classList.add('btn-mode-active');
        btnArray.slice(1).forEach(b => b.classList.remove('btn-mode-active'));
        if (window.roadScanner) {
            window.roadScanner.setMode(mode);
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                if (window.roadScanner) {
                    window.roadScanner.setMode('upload');
                    window.roadScanner.uploadedImg = img;
                    
                    // Simulate automatic detection box on uploaded road image
                    const w = window.roadScanner.canvas.width;
                    const h = window.roadScanner.canvas.height;
                    window.roadScanner.uploadedBoxes = [
                        {
                            x: w * 0.32,
                            y: h * 0.45,
                            w: w * 0.36,
                            h: h * 0.28,
                            type: 'Pothole (Severe Surface Void)',
                            severity: 'critical',
                            depth: 13.8,
                            area: 1.9,
                            confidence: 96.2,
                            zPeak: 3.6
                        }
                    ];

                    this.showToast("Road image uploaded and analyzed by AI!");
                    // Auto-flag detected pothole
                    setTimeout(() => {
                        window.roadScanner.handlePotholeFound(window.roadScanner.uploadedBoxes[0], w * 0.5, h * 0.6);
                    }, 500);
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    handleNewIncident(incident) {
        this.refreshDashboardKPIs();
        this.renderIncidentsTable();
        this.showToast(`🚨 New Hazard Detected: ${incident.type} on ${incident.roadName}`, 'critical');
    }

    refreshDashboardKPIs() {
        if (!window.incidentStore) return;
        const all = window.incidentStore.getAll();

        const totalCount = all.length;
        const criticalCount = all.filter(i => i.severity === 'critical' && i.status !== 'repaired').length;
        const pendingCount = all.filter(i => i.status === 'reported' || i.status === 'work_order_issued').length;
        const inProgressCount = all.filter(i => i.status === 'in_progress').length;
        const repairedCount = all.filter(i => i.status === 'repaired').length;

        const totalCost = all
            .filter(i => i.status !== 'repaired')
            .reduce((sum, i) => sum + (i.estimatedCost || 0), 0);

        // Update DOM elements
        this.setText('kpi-total', totalCount);
        this.setText('kpi-critical', criticalCount);
        this.setText('kpi-pending', pendingCount);
        this.setText('kpi-repaired', repairedCount);
        this.setText('kpi-cost', `₹${totalCost.toLocaleString('en-IN')}`);

        // Update Mini-bar percentages if available
        const repairRate = totalCount > 0 ? Math.round((repairedCount / totalCount) * 100) : 0;
        this.setText('kpi-repair-rate', `${repairRate}% Restored`);
    }

    renderIncidentsTable() {
        const tableBody = document.getElementById('incident-table-body');
        if (!tableBody || !window.incidentStore) return;

        let list = window.incidentStore.getAll();

        // Filters
        const query = (document.getElementById('search-incident-input')?.value || '').toLowerCase().trim();
        const sevFilter = document.getElementById('filter-table-severity')?.value || 'all';
        const stFilter = document.getElementById('filter-table-status')?.value || 'all';

        if (query) {
            list = list.filter(i => 
                i.id.toLowerCase().includes(query) ||
                i.roadName.toLowerCase().includes(query) ||
                i.type.toLowerCase().includes(query)
            );
        }

        if (sevFilter !== 'all') {
            list = list.filter(i => i.severity === sevFilter);
        }

        if (stFilter !== 'all') {
            list = list.filter(i => i.status === stFilter);
        }

        if (list.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-8 text-slate-400">
                        No road incidents match current filters.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = list.map(inc => {
            const sevBadge = inc.severity === 'critical' ? 'badge-critical' : inc.severity === 'moderate' ? 'badge-moderate' : 'badge-minor';
            const statusBadge = `status-${inc.status}`;
            const statusLabel = inc.status.replace(/_/g, ' ').toUpperCase();

            return `
                <tr class="incident-row cursor-pointer hover:bg-slate-800/50 transition" onclick="window.app.openIncidentDetail('${inc.id}')">
                    <td class="font-mono text-cyan-400 font-semibold">${inc.id}</td>
                    <td>
                        <div class="font-medium text-slate-100">${inc.roadName}</div>
                        <div class="text-xs text-slate-400 font-mono">${inc.lat.toFixed(4)}°N, ${inc.lng.toFixed(4)}°E</div>
                    </td>
                    <td>
                        <div class="text-slate-200 text-sm font-semibold">${inc.type}</div>
                        <div class="text-xs text-slate-400">Depth: ${inc.depthCm}cm | Area: ${inc.areaSqM}m²</div>
                    </td>
                    <td>
                        <span class="custom-badge ${sevBadge}">
                            ${inc.severity.toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <span class="status-pill ${statusBadge}">
                            ${statusLabel}
                        </span>
                    </td>
                    <td class="font-mono text-slate-300">
                        ₹${(inc.estimatedCost || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                        <button class="table-action-btn" onclick="event.stopPropagation(); window.app.openIncidentDetail('${inc.id}')">
                            Review / PWD Dispatch &rarr;
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    openIncidentDetail(id) {
        if (!window.incidentStore) return;
        const incident = window.incidentStore.getById(id);
        if (!incident) return;

        this.selectedIncident = incident;
        if (window.soundFX) window.soundFX.playClick();

        // Populate Modal Fields
        this.setText('modal-inc-id', incident.id);
        this.setText('modal-inc-type', incident.type);
        this.setText('modal-inc-road', incident.roadName);
        this.setText('modal-inc-coords', `${incident.lat}°N, ${incident.lng}°E`);
        this.setText('modal-inc-time', incident.timestamp);
        this.setText('modal-inc-depth', `${incident.depthCm} cm`);
        this.setText('modal-inc-area', `${incident.areaSqM} m²`);
        this.setText('modal-inc-conf', `${incident.confidence}%`);
        this.setText('modal-inc-gforce', `${incident.zPeakG || 3.2} G`);
        this.setText('modal-inc-speed', `${incident.speedKmh || 45} km/h`);
        this.setText('modal-inc-vehicle', incident.vehicleId || 'TN-01-PV-4092');
        this.setText('modal-inc-cost', `₹${(incident.estimatedCost || 0).toLocaleString('en-IN')}`);
        this.setText('modal-inc-notes', incident.notes || 'Routine patrol detection');

        // Status badge
        const statusEl = document.getElementById('modal-inc-status');
        if (statusEl) {
            statusEl.className = `status-pill status-${incident.status}`;
            statusEl.innerText = incident.status.replace(/_/g, ' ').toUpperCase();
        }

        // Image Snapshot
        const imgEl = document.getElementById('modal-inc-img');
        if (imgEl) {
            imgEl.src = incident.snapshotUrl || generateDamageThumbnail(incident.snapshotType || 'pothole_deep', incident.severity);
        }

        // Contractor Dropdown
        const contractorSelect = document.getElementById('modal-contractor-select');
        if (contractorSelect) {
            contractorSelect.innerHTML = this.contractorsList.map(c => 
                `<option value="${c}" ${c === incident.contractor ? 'selected' : ''}>${c}</option>`
            ).join('');
        }

        // Show Modal
        const modal = document.getElementById('incident-inspection-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    closeModal() {
        const modal = document.getElementById('incident-inspection-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.selectedIncident = null;
    }

    // PWD Workflow Actions
    issueWorkOrder() {
        if (!this.selectedIncident) return;
        const contractor = document.getElementById('modal-contractor-select')?.value || 'PWD Division Alpha';
        
        window.incidentStore.updateStatus(this.selectedIncident.id, 'work_order_issued', {
            contractor: contractor,
            workOrderId: `PWD-WO-${Math.floor(1000 + Math.random() * 9000)}`,
            issuedDate: new Date().toISOString().substring(0, 10)
        });

        if (window.soundFX) window.soundFX.playSuccess();
        this.showToast(`Work Order dispatched to ${contractor}!`);
        this.refreshDashboardKPIs();
        this.renderIncidentsTable();
        if (window.roadMap) window.roadMap.reloadMarkers(window.roadMap.activeFilter);
        this.closeModal();
    }

    markInProgress() {
        if (!this.selectedIncident) return;
        window.incidentStore.updateStatus(this.selectedIncident.id, 'in_progress');
        if (window.soundFX) window.soundFX.playSuccess();
        this.showToast(`Incident marked: Crew In-Progress on site.`);
        this.refreshDashboardKPIs();
        this.renderIncidentsTable();
        if (window.roadMap) window.roadMap.reloadMarkers(window.roadMap.activeFilter);
        this.closeModal();
    }

    markRepaired() {
        if (!this.selectedIncident) return;
        window.incidentStore.updateStatus(this.selectedIncident.id, 'repaired', {
            repairedDate: new Date().toISOString().substring(0, 10),
            snapshotType: 'pothole_repaired'
        });

        if (window.soundFX) window.soundFX.playSuccess();
        this.showToast(`✅ Road section verified REPAIRED & restored to safety standards!`, 'success');
        this.refreshDashboardKPIs();
        this.renderIncidentsTable();
        if (window.roadMap) window.roadMap.reloadMarkers(window.roadMap.activeFilter);
        this.closeModal();
    }

    locateOnMap() {
        if (!this.selectedIncident) return;
        const id = this.selectedIncident.id;
        this.closeModal();
        this.switchView('map');
        setTimeout(() => {
            if (window.roadMap) window.roadMap.focusIncident(id);
        }, 300);
    }

    exportCsvReport() {
        if (!window.incidentStore) return;
        const items = window.incidentStore.getAll();
        const headers = ["Incident ID", "Road Name", "City", "Latitude", "Longitude", "Damage Type", "Severity", "Status", "Depth (cm)", "Area (m2)", "Confidence (%)", "Z Impact (G)", "Assigned Contractor", "Estimated Cost (INR)", "Timestamp"];
        
        const rows = items.map(i => [
            i.id,
            `"${i.roadName}"`,
            i.city,
            i.lat,
            i.lng,
            `"${i.type}"`,
            i.severity,
            i.status,
            i.depthCm,
            i.areaSqM,
            i.confidence,
            i.zPeakG || '',
            `"${i.contractor || 'Unassigned'}"`,
            i.estimatedCost || 0,
            `"${i.timestamp}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `PWD_RoadDamage_Audit_Report_${new Date().toISOString().substring(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast("Road Audit CSV report exported successfully!");
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast-notification');
        if (!toast) return;

        toast.innerText = message;
        toast.className = `toast-popup toast-${type} toast-show`;

        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('toast-show');
        }, 3800);
    }

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }
}

window.app = new RoadSenseApp();
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
