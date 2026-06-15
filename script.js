/* ==========================================================================
   WASTEWATER MONITORING DASHBOARD: DYNAMIC SCRIPT LOGIC (DARK GLASS SPEC)
   ========================================================================== */

// 1. CONFIGURATION & STATE
let CONFIG = {
  channelId: localStorage.getItem("ts_channel_id") || "123456",
  readApiKey: localStorage.getItem("ts_read_api_key") || "DEMOKEY123",
  isDemoMode: localStorage.getItem("ts_demo_mode") === "false" ? false : true,
  refreshInterval: 15000
};

let state = {
  feeds: [],
  latestFeed: null,
  alerts: [],
  isAudioOn: true,
  countdown: 15,
  refreshTimerId: null,
  charts: {}
};

const THRESHOLDS = {
  ph: { minSafe: 6.5, maxSafe: 8.5, minWarn: 5.5, maxWarn: 9.5 },
  tds: { safe: 500, warn: 1000 },
  turbidity: { safe: 5, warn: 10 },
  temperature: { minSafe: 20, maxSafe: 35, minWarn: 15, maxWarn: 45 }
};

// DOM ELEMENTS
const DOM = {
  loadingOverlay: document.getElementById("loading-overlay"),
  currentTime: document.getElementById("current-time"),
  connectionStatus: document.getElementById("connection-status"),
  countdownTimer: document.getElementById("countdown-timer"),
  refreshIcon: document.getElementById("refresh-icon"),
  sidebarToggle: document.getElementById("sidebar-toggle"),
  sidebar: document.getElementById("app-sidebar"),
  navLinks: document.querySelectorAll(".nav-link"),
  sections: document.querySelectorAll(".content-section"),
  triggerRefreshBtn: document.getElementById("trigger-refresh-btn"),
  dataModeBadge: document.getElementById("data-mode-badge"),
  criticalAlertBanner: document.getElementById("critical-alert-banner"),
  alertBannerText: document.getElementById("alert-banner-text"),
  activeAlertCount: document.getElementById("active-alert-count"),
  
  // Telemetry Cards
  valPh: document.getElementById("val-ph"),
  badgePh: document.getElementById("badge-ph"),
  timePh: document.getElementById("time-ph"),
  barPh: document.getElementById("bar-ph"),
  
  valTds: document.getElementById("val-tds"),
  badgeTds: document.getElementById("badge-tds"),
  timeTds: document.getElementById("time-tds"),
  barTds: document.getElementById("bar-tds"),
  
  valTurbidity: document.getElementById("val-turbidity"),
  badgeTurbidity: document.getElementById("badge-turbidity"),
  timeTurbidity: document.getElementById("time-turbidity"),
  barTurbidity: document.getElementById("bar-turbidity"),
  
  valTemperature: document.getElementById("val-temperature"),
  badgeTemperature: document.getElementById("badge-temperature"),
  timeTemperature: document.getElementById("time-temperature"),
  barTemperature: document.getElementById("bar-temperature"),
  
  // WQI & AI
  wqiScoreNumber: document.getElementById("wqi-score-number"),
  wqiGaugePath: document.getElementById("wqi-gauge-path"),
  wqiStatusBadge: document.getElementById("wqi-status-badge"),
  wqiStatusText: document.getElementById("wqi-status-text"),
  aiConfidenceVal: document.getElementById("ai-confidence-val"),
  aiClassification: document.getElementById("ai-classification"),
  aiRecommendationText: document.getElementById("ai-recommendation-text"),
  
  // Alerts
  alertsList: document.getElementById("alerts-list"),
  clearAlertsBtn: document.getElementById("clear-alerts-btn"),
  toggleSoundBtn: document.getElementById("toggle-sound-btn"),
  soundIcon: document.getElementById("sound-icon"),
  soundBtnText: document.getElementById("sound-btn-text"),
  alertSound: document.getElementById("alert-sound"),
  filterBtns: document.querySelectorAll(".filter-btn"),
  
  // Reports
  btnExportCsv: document.getElementById("btn-export-csv"),
  btnPrintReport: document.getElementById("btn-print-report"),
  statLatestPh: document.getElementById("stat-latest-ph"),
  statAvgPh: document.getElementById("stat-avg-ph"),
  statMinPh: document.getElementById("stat-min-ph"),
  statMaxPh: document.getElementById("stat-max-ph"),
  statLatestTds: document.getElementById("stat-latest-tds"),
  statAvgTds: document.getElementById("stat-avg-tds"),
  statMinTds: document.getElementById("stat-min-tds"),
  statMaxTds: document.getElementById("stat-max-tds"),
  statLatestTurbidity: document.getElementById("stat-latest-turbidity"),
  statAvgTurbidity: document.getElementById("stat-avg-turbidity"),
  statMinTurbidity: document.getElementById("stat-min-turbidity"),
  statMaxTurbidity: document.getElementById("stat-max-turbidity"),
  statLatestTemp: document.getElementById("stat-latest-temp"),
  statAvgTemp: document.getElementById("stat-avg-temp"),
  statMinTemp: document.getElementById("stat-min-temp"),
  statMaxTemp: document.getElementById("stat-max-temp"),
  rawDataBody: document.getElementById("raw-data-body"),
  
  // Config
  configForm: document.getElementById("thingspeak-config-form"),
  inputChannelId: document.getElementById("input-channel-id"),
  inputApiKey: document.getElementById("input-api-key"),
  toggleDemoMode: document.getElementById("toggle-demo-mode"),
  btnLoadDefaultPublic: document.getElementById("btn-load-default-public"),
  statusSensorPh: document.getElementById("status-sensor-ph"),
  statusSensorTds: document.getElementById("status-sensor-tds"),
  statusSensorTurbidity: document.getElementById("status-sensor-turbidity"),
  statusSensorTemp: document.getElementById("status-sensor-temp")
};

// ==========================================================================
// 2. HELPER FUNCTIONS
// ==========================================================================

function updateClock() {
  const now = new Date();
  DOM.currentTime.innerText = now.toLocaleTimeString([], { hour12: true });
}
setInterval(updateClock, 1000);
updateClock();

DOM.sidebarToggle.addEventListener("click", () => {
  DOM.sidebar.classList.toggle("mobile-open");
});

DOM.navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    DOM.sidebar.classList.remove("mobile-open");
    
    const targetSectionId = link.getAttribute("data-target");
    DOM.navLinks.forEach(nl => nl.classList.remove("active"));
    link.classList.add("active");
    
    DOM.sections.forEach(sec => {
      if (sec.id === targetSectionId) {
        sec.classList.add("active");
      } else {
        sec.classList.remove("active");
      }
    });

    if (targetSectionId === "analytics-section") {
      Object.keys(state.charts).forEach(key => {
        state.charts[key].resize();
        state.charts[key].update();
      });
    }
  });
});

function formatTimestamp(isoString) {
  if (!isoString) return "--";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
         " " + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function parseVal(val, decimals = 2) {
  let num = parseFloat(val);
  return isNaN(num) ? null : parseFloat(num.toFixed(decimals));
}

function generateMockReading(prev = {}) {
  let ph = prev.ph ? prev.ph + (Math.random() - 0.5) * 0.4 : 7.2 + (Math.random() - 0.5) * 1.5;
  ph = Math.max(2, Math.min(12, ph));

  let tds = prev.tds ? prev.tds + Math.floor((Math.random() - 0.4) * 80) : 420 + Math.floor((Math.random() - 0.5) * 400);
  tds = Math.max(10, Math.min(1800, tds));

  let turb = prev.turbidity ? prev.turbidity + (Math.random() - 0.45) * 1.5 : 3.4 + (Math.random() - 0.5) * 8;
  turb = Math.max(0.1, Math.min(25, turb));

  let temp = prev.temperature ? prev.temperature + (Math.random() - 0.5) * 0.6 : 26.5 + (Math.random() - 0.5) * 10;
  temp = Math.max(10, Math.min(55, temp));

  return {
    created_at: new Date().toISOString(),
    field1: ph.toFixed(2),
    field2: tds.toFixed(0),
    field3: turb.toFixed(2),
    field4: temp.toFixed(1)
  };
}

// ==========================================================================
// 3. STATUS CRITERIA & WQI ALGORITHMS
// ==========================================================================

function getPhStatus(val) {
  if (val === null) return { text: "Offline", class: "status-offline", code: "info" };
  if (val >= THRESHOLDS.ph.minSafe && val <= THRESHOLDS.ph.maxSafe) {
    return { text: "🟢 Safe", class: "badge-safe", code: "info" };
  } else if ((val >= THRESHOLDS.ph.minWarn && val < THRESHOLDS.ph.minSafe) || 
             (val > THRESHOLDS.ph.maxSafe && val <= THRESHOLDS.ph.maxWarn)) {
    return { text: "🟡 Warning", class: "badge-warning", code: "warning" };
  } else {
    return { text: "🔴 Critical", class: "badge-critical", code: "critical" };
  }
}

function getTdsStatus(val) {
  if (val === null) return { text: "Offline", class: "status-offline", code: "info" };
  if (val <= THRESHOLDS.tds.safe) {
    return { text: "🟢 Safe", class: "badge-safe", code: "info" };
  } else if (val <= THRESHOLDS.tds.warn) {
    return { text: "🟡 Warning", class: "badge-warning", code: "warning" };
  } else {
    return { text: "🔴 Critical", class: "badge-critical", code: "critical" };
  }
}

function getTurbidityStatus(val) {
  if (val === null) return { text: "Offline", class: "status-offline", code: "info" };
  if (val <= THRESHOLDS.turbidity.safe) {
    return { text: "🟢 Safe", class: "badge-safe", code: "info" };
  } else if (val <= THRESHOLDS.turbidity.warn) {
    return { text: "🟡 Warning", class: "badge-warning", code: "warning" };
  } else {
    return { text: "🔴 Critical", class: "badge-critical", code: "critical" };
  }
}

function getTemperatureStatus(val) {
  if (val === null) return { text: "Offline", class: "status-offline", code: "info" };
  if (val >= THRESHOLDS.temperature.minSafe && val <= THRESHOLDS.temperature.maxSafe) {
    return { text: "🟢 Safe", class: "badge-safe", code: "info" };
  } else if ((val >= THRESHOLDS.temperature.minWarn && val < THRESHOLDS.temperature.minSafe) || 
             (val > THRESHOLDS.temperature.maxSafe && val <= THRESHOLDS.temperature.maxWarn)) {
    return { text: "🟡 Warning", class: "badge-warning", code: "warning" };
  } else {
    return { text: "🔴 Critical", class: "badge-critical", code: "critical" };
  }
}

function calculateWQI(ph, tds, turb, temp) {
  if (ph === null || tds === null || turb === null || temp === null) return null;
  
  let q_ph = 100 - (Math.abs(ph - 7.0) / 3.5) * 100;
  q_ph = Math.max(0, Math.min(100, q_ph));

  let q_tds = 100;
  if (tds > 300) {
    q_tds = 100 - ((tds - 300) / 1000) * 100;
  }
  q_tds = Math.max(0, Math.min(100, q_tds));

  let q_turb = 100 - (turb / 15) * 100;
  q_turb = Math.max(0, Math.min(100, q_turb));

  let q_temp = 100 - (Math.abs(temp - 24) / 20) * 100;
  q_temp = Math.max(0, Math.min(100, q_temp));

  let wqi = (q_ph * 0.35) + (q_tds * 0.20) + (q_turb * 0.30) + (q_temp * 0.15);
  return Math.round(wqi);
}

function getWqiClassification(score) {
  if (score === null) return { label: "Unknown", class: "wqi-critical", text: "Connecting telemetry modules..." };
  if (score >= 85) {
    return { label: "Excellent Quality", class: "wqi-excellent", text: "Industrial effluent meets safe environment discharge standards." };
  } else if (score >= 70) {
    return { label: "Good Quality", class: "wqi-good", text: "Wastewater quality within acceptable standards. Safe to release to civil sewers." };
  } else if (score >= 50) {
    return { label: "Moderate Quality", class: "wqi-moderate", text: "Mild pollutants present. Primary filtration recommended before discharge." };
  } else if (score >= 35) {
    return { label: "Poor Wastewater", class: "wqi-poor", text: "Heavily contaminated. Automated neutralizing blocks and flocculant injection activated." };
  } else {
    return { label: "Critical Hazard", class: "wqi-critical", text: "Extreme acidity, heat, or TDS detected. Discharge gate closed. System recycling activated." };
  }
}

function runAIInference(ph, tds, turb, temp) {
  if (ph === null || tds === null || turb === null || temp === null) {
    return {
      classification: "Telemetry Offline",
      confidence: "0%",
      recommendation: "Ensure telemetry nodes are initialized and connected."
    };
  }

  let phStatus = getPhStatus(ph).code;
  let tdsStatus = getTdsStatus(tds).code;
  let turbStatus = getTurbidityStatus(turb).code;
  let tempStatus = getTemperatureStatus(temp).code;

  let confidenceVal = 88 + Math.floor(Math.random() * 9);

  if (ph < 5.0 && tdsStatus === 'critical') {
    return {
      classification: "Acidic Mineralized Runoff",
      confidence: `${confidenceVal}%`,
      recommendation: "Dose NaOH chemical buffer in mixing reactor; engage secondary membrane filters."
    };
  }
  if (ph > 9.5 && tempStatus === 'critical') {
    return {
      classification: "Hot Alkaline Effluent Spill",
      confidence: `${confidenceVal}%`,
      recommendation: "Direct discharge stream to cooling basin; inject diluting acidic agent to balance pH."
    };
  }
  if (turb > 12 && tdsStatus === 'critical') {
    return {
      classification: "High-Suspended Sludge Load",
      confidence: `${confidenceVal}%`,
      recommendation: "Trigger automatic polymer flocculation block; check primary settling tank levels."
    };
  }
  if (phStatus === 'warning' || tdsStatus === 'warning' || turbStatus === 'warning') {
    return {
      classification: "Contaminated Effluent Deviation",
      confidence: `${confidenceVal - 4}%`,
      recommendation: "Increase mechanical filter scrubbing cycles; monitor buffer tanks."
    };
  }
  if (phStatus === 'info' && tdsStatus === 'info' && turbStatus === 'info' && tempStatus === 'info') {
    return {
      classification: "Purified Water Standard",
      confidence: `${confidenceVal + 3}%`,
      recommendation: "Fluid matches safe environment discharging benchmarks. Drainage valve opened."
    };
  }

  return {
    classification: "General Treated Wastewater",
    confidence: `${confidenceVal - 6}%`,
    recommendation: "Direct fluid through standard biological oxidation and sand filter blocks."
  };
}

// ==========================================================================
// 4. CHART.JS VISUALIZATION MANAGEMENT (DARK THEME STYLED FOR BLACK GLASS)
// ==========================================================================

function initCharts() {
  const chartConfigs = [
    { id: "chart-ph-canvas", label: "pH Level", color: "#A855F7", border: "#A855F7" },
    { id: "chart-tds-canvas", label: "TDS (ppm)", color: "#00E5FF", border: "#00E5FF" },
    { id: "chart-turbidity-canvas", label: "Turbidity (NTU)", color: "#F59E0B", border: "#F59E0B" },
    { id: "chart-temp-canvas", label: "Temperature (°C)", color: "#EF4444", border: "#EF4444" }
  ];

  chartConfigs.forEach(cfg => {
    const ctx = document.getElementById(cfg.id).getContext("2d");
    
    const fillGrd = ctx.createLinearGradient(0, 0, 0, 180);
    fillGrd.addColorStop(0, cfg.color + "20");
    fillGrd.addColorStop(1, cfg.color + "00");

    state.charts[cfg.id] = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [{
          label: cfg.label,
          data: [],
          borderColor: cfg.border,
          backgroundColor: fillGrd,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: cfg.border,
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#0c101a',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleFont: { family: 'Outfit', weight: 'bold', size: 11 },
            bodyFont: { family: 'Plus Jakarta Sans', size: 11 },
            titleColor: '#ffffff',
            bodyColor: '#94A3B8'
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { maxTicksLimit: 6, font: { size: 9 }, color: '#94A3B8' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { font: { size: 9 }, color: '#94A3B8' }
          }
        }
      }
    });
  });
}

function updateChartsData(feeds) {
  const sortedFeeds = [...feeds].reverse();
  const labels = sortedFeeds.map(f => {
    const d = new Date(f.created_at);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const phData = sortedFeeds.map(f => parseVal(f.field1));
  const tdsData = sortedFeeds.map(f => parseVal(f.field2, 0));
  const turbData = sortedFeeds.map(f => parseVal(f.field3));
  const tempData = sortedFeeds.map(f => parseVal(f.field4));

  if (state.charts["chart-ph-canvas"]) {
    state.charts["chart-ph-canvas"].data.labels = labels;
    state.charts["chart-ph-canvas"].data.datasets[0].data = phData;
    state.charts["chart-ph-canvas"].update();
  }
  if (state.charts["chart-tds-canvas"]) {
    state.charts["chart-tds-canvas"].data.labels = labels;
    state.charts["chart-tds-canvas"].data.datasets[0].data = tdsData;
    state.charts["chart-tds-canvas"].update();
  }
  if (state.charts["chart-turbidity-canvas"]) {
    state.charts["chart-turbidity-canvas"].data.labels = labels;
    state.charts["chart-turbidity-canvas"].data.datasets[0].data = turbData;
    state.charts["chart-turbidity-canvas"].update();
  }
  if (state.charts["chart-temp-canvas"]) {
    state.charts["chart-temp-canvas"].data.labels = labels;
    state.charts["chart-temp-canvas"].data.datasets[0].data = tempData;
    state.charts["chart-temp-canvas"].update();
  }
}

// ==========================================================================
// 5. ALERT & LOG ENGINE
// ==========================================================================

function playAlertSound() {
  if (state.isAudioOn) {
    DOM.alertSound.play().catch(e => console.log("Audio block override active."));
  }
}

function pushAlert(title, text, severity) {
  const timestamp = new Date();
  const alertObj = { title, text, severity, time: timestamp.toLocaleTimeString() };
  
  state.alerts.unshift(alertObj);

  if (state.alerts.length > 50) {
    state.alerts.pop();
  }

  renderAlerts();
  updateAlertBadge();
}

function updateAlertBadge() {
  const criticalCount = state.alerts.filter(a => a.severity === 'critical').length;
  if (criticalCount > 0) {
    DOM.activeAlertCount.innerText = criticalCount;
    DOM.activeAlertCount.style.display = "block";
  } else {
    DOM.activeAlertCount.style.display = "none";
  }
}

function renderAlerts(filter = "all") {
  DOM.alertsList.innerHTML = "";
  
  let filtered = state.alerts;
  if (filter !== "all") {
    filtered = state.alerts.filter(a => a.severity === filter);
  }

  if (filtered.length === 0) {
    DOM.alertsList.innerHTML = `
      <div class="alert-empty-state">
        <i class="fa-solid fa-circle-check"></i>
        <p>No logged items matching selected filter.</p>
      </div>`;
    return;
  }

  filtered.forEach(alert => {
    let severityClass = "alert-safe-item";
    let icon = '<i class="fa-solid fa-circle-info"></i>';

    if (alert.severity === 'critical') {
      severityClass = "alert-critical-item";
      icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    } else if (alert.severity === 'warning') {
      severityClass = "alert-warning-item";
      icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    }

    const item = document.createElement("div");
    item.className = `alert-item ${severityClass}`;
    item.innerHTML = `
      <div class="alert-item-icon">${icon}</div>
      <div class="alert-item-content">
        <div class="alert-item-header">
          <span class="alert-title">${alert.title}</span>
          <span class="alert-time">${alert.time}</span>
        </div>
        <p class="alert-desc">${alert.text}</p>
      </div>`;
    
    DOM.alertsList.appendChild(item);
  });
}

DOM.clearAlertsBtn.addEventListener("click", () => {
  state.alerts = [];
  renderAlerts();
  updateAlertBadge();
});

DOM.toggleSoundBtn.addEventListener("click", () => {
  state.isAudioOn = !state.isAudioOn;
  if (state.isAudioOn) {
    DOM.soundIcon.className = "fa-solid fa-volume-high";
    DOM.soundBtnText.innerText = "Audio Alert: On";
  } else {
    DOM.soundIcon.className = "fa-solid fa-volume-xmark";
    DOM.soundBtnText.innerText = "Audio Alert: Off";
  }
});

DOM.filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    DOM.filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderAlerts(btn.dataset.filter);
  });
});

function evaluateThresholds(ph, tds, turb, temp) {
  let hasCritical = false;
  let phState = getPhStatus(ph);
  let tdsState = getTdsStatus(tds);
  let turbState = getTurbidityStatus(turb);
  let tempState = getTemperatureStatus(temp);

  DOM.criticalAlertBanner.classList.add("hidden");

  // pH checks
  if (phState.code === 'critical') {
    pushAlert("Critical pH Breach", `Acidic discharge breach: pH registered at ${ph} pH. Lock outflow gate.`, "critical");
    hasCritical = true;
  } else if (phState.code === 'warning') {
    pushAlert("pH Level Warning", `pH level shifted to ${ph} pH. Check neutralizer reserves.`, "warning");
  }

  // TDS checks
  if (tdsState.code === 'critical') {
    pushAlert("Critical TDS Breach", `Extremely high TDS levels logged at ${tds} ppm. Recycle loop active.`, "critical");
    hasCritical = true;
  } else if (tdsState.code === 'warning') {
    pushAlert("TDS Level Warning", `Dissolved mineral solids at ${tds} ppm. Monitor water softeners.`, "warning");
  }

  // Turbidity checks
  if (turbState.code === 'critical') {
    pushAlert("Critical Turbidity Breach", `Effluent turbidity registered a high ${turb} NTU. Divert to clarifiers.`, "critical");
    hasCritical = true;
  } else if (turbState.code === 'warning') {
    pushAlert("Turbidity Warning", `Water clarity warnings: Turbidity rose to ${turb} NTU. Clean screen mesh.`, "warning");
  }

  // Temp checks
  if (tempState.code === 'critical') {
    pushAlert("Critical Temp Breach", `Wastewater temperature rose to thermal hazard limit: ${temp}°C. cooling active.`, "critical");
    hasCritical = true;
  } else if (tempState.code === 'warning') {
    pushAlert("Temperature Warning", `Effluent heat logs at warning ${temp}°C. Monitor cooling tower fans.`, "warning");
  }

  if (hasCritical) {
    DOM.criticalAlertBanner.classList.remove("hidden");
    DOM.alertBannerText.innerText = "CRITICAL TELEMETRY WARNING: Discharge gates locked closed. Sluice diverted.";
    playAlertSound();
  }
}

// ==========================================================================
// 6. REPORTS LOG & STATISTICS
// ==========================================================================

function compileStatistics(feeds) {
  if (feeds.length === 0) return;

  const getStats = (arr) => {
    let parsedArr = arr.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (parsedArr.length === 0) return { avg: "--", min: "--", max: "--" };
    
    let sum = parsedArr.reduce((a, b) => a + b, 0);
    let avg = (sum / parsedArr.length).toFixed(2);
    let min = Math.min(...parsedArr).toFixed(2);
    let max = Math.max(...parsedArr).toFixed(2);

    return { avg, min, max };
  };

  const phStats = getStats(feeds.map(f => f.field1));
  const tdsStats = getStats(feeds.map(f => f.field2));
  const turbStats = getStats(feeds.map(f => f.field3));
  const tempStats = getStats(feeds.map(f => f.field4));

  DOM.statAvgPh.innerText = phStats.avg;
  DOM.statMinPh.innerText = phStats.min;
  DOM.statMaxPh.innerText = phStats.max;

  DOM.statAvgTds.innerText = Math.round(tdsStats.avg) || "--";
  DOM.statMinTds.innerText = Math.round(tdsStats.min) || "--";
  DOM.statMaxTds.innerText = Math.round(tdsStats.max) || "--";

  DOM.statAvgTurbidity.innerText = turbStats.avg;
  DOM.statMinTurbidity.innerText = turbStats.min;
  DOM.statMaxTurbidity.innerText = turbStats.max;

  DOM.statAvgTemp.innerText = tempStats.avg;
  DOM.statMinTemp.innerText = tempStats.min;
  DOM.statMaxTemp.innerText = tempStats.max;
}

function renderRawDataTable(feeds) {
  DOM.rawDataBody.innerHTML = "";
  
  if (feeds.length === 0) {
    DOM.rawDataBody.innerHTML = '<tr><td colspan="6" class="table-empty">Awaiting data stream...</td></tr>';
    return;
  }

  feeds.forEach(f => {
    const ph = parseVal(f.field1);
    const tds = parseVal(f.field2, 0);
    const turb = parseVal(f.field3);
    const temp = parseVal(f.field4);
    
    const wqi = calculateWQI(ph, tds, turb, temp);
    const rating = getWqiClassification(wqi).label;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatTimestamp(f.created_at)}</td>
      <td><strong>${ph !== null ? ph : '--'}</strong></td>
      <td>${tds !== null ? tds : '--'}</td>
      <td>${turb !== null ? turb : '--'}</td>
      <td>${temp !== null ? temp : '--'} °C</td>
      <td><span class="status-badge-mini ${wqi >= 70 ? 'badge-safe' : (wqi >= 50 ? 'badge-warning' : 'badge-critical')}">${rating}</span></td>
    `;
    DOM.rawDataBody.appendChild(row);
  });
}

DOM.btnExportCsv.addEventListener("click", () => {
  if (state.feeds.length === 0) {
    alert("No data to export.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Timestamp,pH,TDS (ppm),Turbidity (NTU),Temperature (C),WQI Score,Status\r\n";

  state.feeds.forEach(f => {
    const ph = parseVal(f.field1) || "";
    const tds = parseVal(f.field2, 0) || "";
    const turb = parseVal(f.field3) || "";
    const temp = parseVal(f.field4) || "";
    const wqi = calculateWQI(ph, tds, turb, temp) || "";
    const status = getWqiClassification(wqi).label;

    csvContent += `"${f.created_at}","${ph}","${tds}","${turb}","${temp}","${wqi}","${status}"\r\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `wastewater_report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

DOM.btnPrintReport.addEventListener("click", () => {
  document.querySelector(".print-date").innerText = new Date().toLocaleString();
  document.querySelector(".print-channel").innerText = CONFIG.isDemoMode ? "SIMULATOR ACTIVE" : CONFIG.channelId;
  document.querySelector(".print-mode-text").innerText = CONFIG.isDemoMode ? "DEMO SIMULATION" : "LIVE CLOUD CONNECT";
  document.querySelector(".print-report-id").innerText = "EFF-" + Math.floor(100000 + Math.random() * 900000);

  window.print();
});

// ==========================================================================
// 7. THINGSPEAK API CLIENT & SIMULATION ENGINE
// ==========================================================================

async function fetchThingSpeakData() {
  DOM.refreshIcon.classList.add("loading");
  
  if (CONFIG.isDemoMode) {
    simulateDataFetch();
    return;
  }

  const url = `https://api.thingspeak.com/channels/${CONFIG.channelId}/feeds.json?api_key=${CONFIG.readApiKey}&results=50`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ThingSpeak Server returned status ${response.status}`);
    }
    const data = await response.json();
    
    if (data && data.feeds) {
      processFetchedFeeds(data.feeds);
      updateConnectionStatus(true);
    } else {
      throw new Error("Empty or invalid data fields received.");
    }
  } catch (error) {
    console.error("ThingSpeak Connection Error:", error);
    updateConnectionStatus(false, error.message);
    pushAlert("ThingSpeak Connection Fail", `Channel ${CONFIG.channelId} unreachable. Activating simulated fallback engine.`, "warning");
    simulateDataFetch();
  } finally {
    DOM.refreshIcon.classList.remove("loading");
  }
}

function simulateDataFetch() {
  updateConnectionStatus(true, "Simulated");

  if (state.feeds.length === 0) {
    let mockList = [];
    let currentMock = generateMockReading();
    mockList.push(currentMock);
    
    for (let i = 1; i < 50; i++) {
      let timeOffset = new Date(new Date().getTime() - i * 60 * 1000);
      let stepMock = generateMockReading(currentMock);
      stepMock.created_at = timeOffset.toISOString();
      mockList.push(stepMock);
      currentMock = stepMock;
    }
    state.feeds = mockList;
  } else {
    let lastMock = state.feeds[0];
    let nextMock = generateMockReading(lastMock);
    state.feeds.unshift(nextMock);
    if (state.feeds.length > 50) {
      state.feeds.pop();
    }
  }

  processFetchedFeeds(state.feeds);
}

function processFetchedFeeds(feeds) {
  state.feeds = feeds;
  state.latestFeed = feeds[0];

  const ph = parseVal(state.latestFeed.field1);
  const tds = parseVal(state.latestFeed.field2, 0);
  const turb = parseVal(state.latestFeed.field3);
  const temp = parseVal(state.latestFeed.field4);

  DOM.valPh.innerText = ph !== null ? ph : "--";
  DOM.valTds.innerText = tds !== null ? tds : "--";
  DOM.valTurbidity.innerText = turb !== null ? turb : "--";
  DOM.valTemperature.innerText = temp !== null ? temp : "--";

  const tsText = formatTimestamp(state.latestFeed.created_at);
  DOM.timePh.innerText = tsText;
  DOM.timeTds.innerText = tsText;
  DOM.timeTurbidity.innerText = tsText;
  DOM.timeTemperature.innerText = tsText;

  const phStatus = getPhStatus(ph);
  DOM.badgePh.innerText = phStatus.text;
  DOM.badgePh.className = `status-badge-mini ${phStatus.class}`;
  DOM.barPh.style.width = ph !== null ? `${(ph / 14) * 100}%` : "0%";
  DOM.barPh.style.backgroundColor = phStatus.code === 'critical' ? 'var(--danger)' : (phStatus.code === 'warning' ? 'var(--warning)' : 'var(--success)');

  const tdsStatus = getTdsStatus(tds);
  DOM.badgeTds.innerText = tdsStatus.text;
  DOM.badgeTds.className = `status-badge-mini ${tdsStatus.class}`;
  DOM.barTds.style.width = tds !== null ? `${Math.min(100, (tds / 1200) * 100)}%` : "0%";
  DOM.barTds.style.backgroundColor = tdsStatus.code === 'critical' ? 'var(--danger)' : (tdsStatus.code === 'warning' ? 'var(--warning)' : 'var(--success)');

  const turbStatus = getTurbidityStatus(turb);
  DOM.badgeTurbidity.innerText = turbStatus.text;
  DOM.badgeTurbidity.className = `status-badge-mini ${turbStatus.class}`;
  DOM.barTurbidity.style.width = turb !== null ? `${Math.min(100, (turb / 18) * 100)}%` : "0%";
  DOM.barTurbidity.style.backgroundColor = turbStatus.code === 'critical' ? 'var(--danger)' : (turbStatus.code === 'warning' ? 'var(--warning)' : 'var(--success)');

  const tempStatus = getTemperatureStatus(temp);
  DOM.badgeTemperature.innerText = tempStatus.text;
  DOM.badgeTemperature.className = `status-badge-mini ${tempStatus.class}`;
  DOM.barTemperature.style.width = temp !== null ? `${Math.min(100, (temp / 55) * 100)}%` : "0%";
  DOM.barTemperature.style.backgroundColor = tempStatus.code === 'critical' ? 'var(--danger)' : (tempStatus.code === 'warning' ? 'var(--warning)' : 'var(--success)');

  evaluateThresholds(ph, tds, turb, temp);

  const wqi = calculateWQI(ph, tds, turb, temp);
  DOM.wqiScoreNumber.innerText = wqi !== null ? wqi : "--";
  
  if (wqi !== null) {
    const offset = 125.6 - (wqi / 100) * 125.6;
    DOM.wqiGaugePath.style.strokeDashoffset = offset;
    
    const wqiEval = getWqiClassification(wqi);
    DOM.wqiStatusBadge.innerText = wqiEval.label;
    DOM.wqiStatusBadge.className = `wqi-status-badge-large ${wqiEval.class}`;
    DOM.wqiStatusText.innerText = wqiEval.text;
  }

  const aiResult = runAIInference(ph, tds, turb, temp);
  DOM.aiClassification.innerText = aiResult.classification;
  DOM.aiConfidenceVal.innerText = aiResult.confidence;
  DOM.aiRecommendationText.innerText = aiResult.recommendation;

  updateSensorDiagnostics(ph, tds, turb, temp);
  compileStatistics(feeds);
  renderRawDataTable(feeds);
  updateChartsData(feeds);
  
  DOM.statLatestPh.innerText = ph !== null ? ph : "--";
  DOM.statLatestTds.innerText = tds !== null ? tds : "--";
  DOM.statLatestTurbidity.innerText = turb !== null ? turb : "--";
  DOM.statLatestTemp.innerText = temp !== null ? temp + " °C" : "--";
}

function updateSensorDiagnostics(ph, tds, turb, temp) {
  const toggleDiagBadge = (el, status) => {
    if (status) {
      el.className = "status-indicator online";
      el.innerHTML = '<i class="fa-solid fa-circle"></i> Online';
    } else {
      el.className = "status-indicator offline";
      el.innerHTML = '<i class="fa-solid fa-circle"></i> Offline';
    }
  };

  toggleDiagBadge(DOM.statusSensorPh, ph !== null);
  toggleDiagBadge(DOM.statusSensorTds, tds !== null);
  toggleDiagBadge(DOM.statusSensorTurbidity, turb !== null);
  toggleDiagBadge(DOM.statusSensorTemp, temp !== null);
}

function updateConnectionStatus(isOnline, modeInfo = "") {
  if (isOnline) {
    if (modeInfo === "Simulated") {
      DOM.connectionStatus.className = "status-badge status-simulation";
      DOM.connectionStatus.querySelector(".status-text").innerText = "Simulated";
      DOM.dataModeBadge.className = "badge-mode mode-demo";
      DOM.dataModeBadge.innerText = "SIMULATED";
    } else {
      DOM.connectionStatus.className = "status-badge status-online";
      DOM.connectionStatus.querySelector(".status-text").innerText = "Cloud Online";
      DOM.dataModeBadge.className = "badge-mode mode-live";
      DOM.dataModeBadge.innerText = "LIVE CLOUD";
    }
  } else {
    DOM.connectionStatus.className = "status-badge status-offline";
    DOM.connectionStatus.querySelector(".status-text").innerText = "Cloud Error";
    DOM.dataModeBadge.className = "badge-mode mode-demo";
    DOM.dataModeBadge.innerText = "OFFLINE FALLBACK";
  }
}

function startTimerLoop() {
  if (state.refreshTimerId) {
    clearInterval(state.refreshTimerId);
  }

  state.countdown = 15;
  DOM.countdownTimer.innerText = `${state.countdown}s`;

  state.refreshTimerId = setInterval(() => {
    state.countdown--;
    DOM.countdownTimer.innerText = `${state.countdown}s`;

    if (state.countdown <= 0) {
      fetchThingSpeakData();
      state.countdown = 15;
    }
  }, 1000);
}

DOM.triggerRefreshBtn.addEventListener("click", () => {
  fetchThingSpeakData();
  startTimerLoop();
});

// ==========================================================================
// 8. INITIALIZATION & CONFIGURATION FORM BINDINGS
// ==========================================================================

function loadConfigIntoForm() {
  DOM.inputChannelId.value = CONFIG.channelId;
  DOM.inputApiKey.value = CONFIG.readApiKey;
  DOM.toggleDemoMode.checked = CONFIG.isDemoMode;
}

DOM.configForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  CONFIG.channelId = DOM.inputChannelId.value.trim();
  CONFIG.readApiKey = DOM.inputApiKey.value.trim();
  CONFIG.isDemoMode = DOM.toggleDemoMode.checked;

  localStorage.setItem("ts_channel_id", CONFIG.channelId);
  localStorage.setItem("ts_read_api_key", CONFIG.readApiKey);
  localStorage.setItem("ts_demo_mode", CONFIG.isDemoMode);

  pushAlert("Config Sync", `Bound dashboard parameters to Channel ${CONFIG.channelId}. Mode: ${CONFIG.isDemoMode ? 'Simulated' : 'Cloud Connect'}.`, "info");
  
  DOM.loadingOverlay.classList.remove("hidden");
  fetchThingSpeakData().then(() => {
    setTimeout(() => {
      DOM.loadingOverlay.classList.add("hidden");
    }, 600);
  });
  
  startTimerLoop();
});

DOM.btnLoadDefaultPublic.addEventListener("click", () => {
  DOM.inputChannelId.value = "12397";
  DOM.inputApiKey.value = ""; 
  DOM.toggleDemoMode.checked = false;
  DOM.configForm.dispatchEvent(new Event("submit"));
});

window.addEventListener("DOMContentLoaded", () => {
  initCharts();
  loadConfigIntoForm();

  fetchThingSpeakData().then(() => {
    setTimeout(() => {
      DOM.loadingOverlay.classList.add("hidden");
    }, 800);
  });

  startTimerLoop();
});
