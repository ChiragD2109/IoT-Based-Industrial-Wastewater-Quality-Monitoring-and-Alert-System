# IoT-Based Industrial Wastewater Quality Monitoring and Alert System
### *QualityGuard: Smart Water Quality. Real-Time Insights.*

A web-based IoT monitoring and compliance platform designed to monitor industrial wastewater quality using critical parameters: **pH Level, Total Dissolved Solids (TDS), Turbidity, and Temperature**. The platform delivers continuous real-time telemetry, analytical visualization, transition-based incident logging, and automated compliance reporting to support environmental safety, pollution control, and CPCB regulatory compliance.

> **Current Status:** Phase 1 Completed (Full Responsive Web Platform with Live ThingSpeak Telemetry, Theme Engine & Edge Inference)

---

## 📌 Project Overview

Industrial wastewater often contains harmful pollutants, toxic chemicals, and suspended particulate matter that can adversely damage aquatic ecosystems and public health if discharged without proper continuous monitoring.

**QualityGuard** provides an automated, end-to-end telemetry dashboard that continuously monitors wastewater quality parameters transmitted from an ESP32 microcontroller to the ThingSpeak IoT Cloud. The platform calculates a composite **Water Quality Index (WQI)**, generates prescriptive **Edge AI recommendations**, logs non-spamming incident alerts across **Safe**, **Warning**, and **Critical** thresholds, and generates auditable CSV and printable PDF reports.

---

## ✨ Features

- 📊 **Interactive Real-Time Dashboard:** Live telemetry cards for pH, TDS, Turbidity, and Temperature with threshold badges and animated gauge meters.
- 🌓 **Comprehensive Theme Engine:** Dedicated 3-way selection bar supporting **Light Mode**, **Dark Mode**, and **System Auto-Sync** with dynamic Chart.js theme re-coloring and zero white flash.
- 🔤 **Modern Typography:** Engineered with **Space Grotesk** for clean, readable headings and **JetBrains Mono** for numerical telemetry data.
- 📈 **Analytics & Trend Visualization:** 5 rolling historical trend charts powered by Chart.js (pH, TDS, Turbidity, Temperature, and System Status).
- 🚨 **Transition-Based Incident Alerts:** Non-spamming alert engine with multi-tier classifications (**Critical Hazards**, **Parameter Warnings**, **Safe / Informational**) with duplicate suppression and single-notice offline alerts.
- 🧮 **Automated WQI Scoring:** Weighted Arithmetic Water Quality Index computation following CPCB and WHO standards.
- 🤖 **Edge AI Diagnostic Classifier:** Rule-based heuristic inference providing automated wastewater categorization and prescriptive chemical/physical treatment steps.
- 📄 **Auditable Compliance Reports:** Statistical aggregate table (Average, Min, Max), raw packet data viewer, and one-click CSV export.
- 🖨️ **Print & Audit PDF View:** Formal report generation layout with timestamped IDs and supervisor sign-off lines.
- ⚙️ **Dynamic System Configuration:** Runtime ThingSpeak Channel ID and Read API Key binding with `localStorage` persistence.
- 📱 **Fully Responsive Layout:** Optimized for mobile phones, tablets, laptops, and ultra-wide monitoring displays.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5:** Semantic architecture, single-page application structure
- **CSS3:** Custom responsive design system with CSS custom variables, glassmorphism, and full dark theme
- **JavaScript (ES6+):** Asynchronous ThingSpeak REST consumer, WQI engine, state-transition alert system
- **Chart.js:** Responsive rolling trend charts with dark/light theme adaptability
- **FontAwesome 6:** Scalable SVG vector icons
- **Google Fonts:** Space Grotesk (primary UI) & JetBrains Mono (telemetry values)

### Embedded Hardware (Planned / Interfacing)
- **ESP32-WROOM-32 / NodeMCU ESP8266** Microcontroller
- **Analog pH Probe Sensor Kit** (0 – 14 pH)
- **Analog TDS Conductivity Meter** (0 – 1000+ ppm)
- **Optoelectronic Turbidity Sensor TS-300B** (0 – 200+ NTU)
- **DS18B20 Waterproof Temperature Sensor** (0 – 60 °C)
- **Active Piezo Buzzer & Bi-Color LED Indicators**

### Cloud Telemetry
- **ThingSpeak IoT Cloud** (REST API / feeds.json polling @ 20s interval)
- Channel ID: `3408255`

---

## 🎯 Water Quality Threshold Standards

| Parameter | 🟢 Safe Limit | 🟡 Warning Limit | 🔴 Critical Hazard | Regulatory Reference |
| :--- | :--- | :--- | :--- | :--- |
| **pH Value** | $6.5 - 8.5\text{ pH}$ | $6.0 - 6.4$ or $8.6 - 9.0\text{ pH}$ | $< 6.0$ or $> 9.0\text{ pH}$ | CPCB Inland Surface Standards |
| **Total Dissolved Solids (TDS)** | $\le 350\text{ ppm}$ | $351 - 500\text{ ppm}$ | $> 500\text{ ppm}$ | WHO Effluent Discharge Norms |
| **Turbidity** | $\le 50\text{ NTU}$ | $51 - 100\text{ NTU}$ | $> 100\text{ NTU}$ | Central Pollution Control Board |
| **Water Temperature** | $\le 30^\circ\text{C}$ | $31 - 35^\circ\text{C}$ | $> 35^\circ\text{C}$ | Thermal Pollution Guidelines |
| **Hardware Discharge (Field 5)** | `0 (SAFE)` | — | `1 (UNSAFE)` | Automated Valve Safety Lockout |

---

## 📂 Project Structure

```text
IoT-Based-Industrial-Wastewater-Quality-Monitoring-and-Alert-System/
├── index.html          # Semantic Single-Page Application (SPA) container
├── style.css           # Design system, CSS variables, Light & Dark themes, responsive grid
├── script.js           # ThingSpeak REST client, WQI calculation, Chart.js managers, alert engine
├── DOCUMENTATION.md    # Comprehensive academic and technical documentation
└── README.md           # Project overview and quickstart guide
```

---

## 🚀 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ChiragD2109/IoT-Based-Industrial-Wastewater-Quality-Monitoring-and-Alert-System.git
   cd IoT-Based-Industrial-Wastewater-Quality-Monitoring-and-Alert-System
   ```

2. **Open in Browser:**
   - Double-click `index.html` to open directly in your web browser.
   - *Or* run a local web server (recommended):
     ```bash
     python -m http.server 8000
     ```
     Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 👨‍💻 Project Team (Batch A7)

Developed as a **Major Project** for Bachelor of Engineering in Information Science & Engineering at **SJB Institute of Technology (SJBIT)**:

- **Abdul Razakh** (`1JB23IS002`)
- **Aditya Chillarge** (`1JB23IS008`)
- **Akash S** (`1JB23IS011`)
- **Chirag D** (`1JB23IS045`)

**Project Supervisor:** Dr. Manu M N, Professor, Department of ISE

---

## 📄 License

This project is developed for academic, environmental safety, and educational purposes.
