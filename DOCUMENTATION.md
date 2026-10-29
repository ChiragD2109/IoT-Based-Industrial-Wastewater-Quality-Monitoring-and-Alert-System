# Comprehensive Technical Documentation
## IoT-Based Industrial Wastewater Quality Monitoring and Alert System

---

### Project Metadata
- **Project Title:** IoT-Based Industrial Wastewater Quality Monitoring and Alert System
- **Institution:** SJB Institute of Technology (SJBIT), Department of Information Science & Engineering (ISE)
- **Academic Batch:** Batch A7 (2026)
- **Project Authors:** 
  - Abdul Razakh (`1JB23IS002`)
  - Aditya Chillarge (`1JB23IS008`)
  - Akash S (`1JB23IS011`)
  - Chirag D (`1JB23IS045`)
- **Project Supervisor:** Dr. Manu M N, Professor, Department of ISE
- **Repository:** [https://github.com/ChiragD2109/IoT-Based-Industrial-Wastewater-Quality-Monitoring-and-Alert-System](https://github.com/ChiragD2109/IoT-Based-Industrial-Wastewater-Quality-Monitoring-and-Alert-System)
- **Live ThingSpeak Public Channel:** Channel ID `3408255`

---

## 1. Executive Summary & Problem Definition

### 1.1 Context & Motivation
Rapid industrialization and manufacturing activities produce significant volumes of industrial effluent containing toxic chemicals, heavy metals, suspended particulate matter, and acidic or alkaline substances. Conventional water quality testing relies primarily on manual sample collection followed by laboratory-based wet chemistry analysis. This traditional approach suffers from:
1. **Severe Latency:** Laboratory analysis takes hours to days, allowing toxic discharges to propagate into natural waterways unchecked.
2. **High Labor and Logistics Costs:** Routine sample extraction and reagent consumption are costly and error-prone.
3. **Lack of Continuous Telemetry:** Sporadic grab-sampling cannot detect transient chemical spikes, nocturnal illegal discharges, or sudden equipment failures in effluent treatment plants (ETPs).

### 1.2 Proposed Solution
The **IoT-Based Industrial Wastewater Quality Monitoring and Alert System** offers an automated, real-time, end-to-end monitoring and notification platform. Physical sensor nodes immersed in industrial wastewater measure critical physico-chemical parameters:
- **pH Level** (acidity / alkalinity)
- **Total Dissolved Solids (TDS)** (salinity, conductivity, dissolved mineral ions)
- **Turbidity** (suspended solids and water clarity)
- **Water Temperature** (thermal pollution and metabolic impact)

Sensor measurements are collected by an **ESP32 microcontroller**, pre-processed, transmitted over Wi-Fi to a **ThingSpeak IoT Cloud Channel**, and visualized on an **AI-powered responsive web dashboard**. The platform computes a composite **Water Quality Index (WQI)**, runs an **Edge AI Inference Engine** for automated effluent classification and prescriptive corrective recommendations, triggers real-time visual and audio alerts when thresholds are breached, and exports auditable CSV/PDF compliance reports.

---

## 2. System Architecture & Information Pipeline

```mermaid
flowchart TD
    subgraph Sensing_Layer["1. Sensing Layer (Industrial Effluent)"]
        S1["pH Probe Sensor<br/>(0 - 14 pH)"]
        S2["TDS Conductivity Sensor<br/>(0 - 1000+ ppm)"]
        S3["Turbidity Sensor<br/>(0 - 200+ NTU)"]
        S4["DS18B20 Temp Sensor<br/>(0 - 60 °C)"]
    end

    subgraph Edge_Processing["2. Edge Microcontroller & Local Safety"]
        MCU["ESP32 / ESP8266 Microcontroller<br/>- ADC Analog Sampling<br/>- Calibration & Polynomial Mapping<br/>- Wi-Fi 802.11 b/g/n Client"]
        Buzzer["Local Hardware Actuation<br/>(Piezo Buzzer & Warning LED)"]
        MCU -->|Threshold Breach| Buzzer
    end

    subgraph Cloud_Layer["3. Cloud Telemetry & Storage"]
        TS["ThingSpeak IoT Cloud<br/>REST API Engine<br/>Channel ID: 3408255"]
        F1["field1: pH"]
        F2["field2: TDS"]
        F3["field3: Turbidity"]
        F4["field4: Temperature"]
        F5["field5: Status (0=Safe, 1=Unsafe)"]
        TS --> F1 & F2 & F3 & F4 & F5
    end

    subgraph Client_Application["4. Frontend Web Dashboard & Analytics"]
        UI_Dash["Real-Time Dashboard<br/>- Dynamic Telemetry Cards<br/>- Dual Status Indicators"]
        WQI_Engine["Mathematical WQI Engine<br/>- Weighted Arithmetic Scoring<br/>- Status Gauge (0-100)"]
        AI_Engine["Edge AI Inference Engine<br/>- Contaminant Classification<br/>- Treatment Recommendations"]
        UI_Charts["Analytics & Trends<br/>- Chart.js 50-Sample Rolling<br/>- Multi-parameter Line Graphs"]
        Alert_Sys["Alerts & Log Engine<br/>- Audio Chime<br/>- Severity Categorization"]
        Report_Sys["Compliance & Audit<br/>- Statistical Aggregate Table<br/>- CSV Export & Printable Report"]
    end

    S1 & S2 & S3 & S4 -->|Analog/Digital Signals| MCU
    MCU -->|HTTP POST / REST Write API| TS
    TS -->|HTTP GET /feeds.json (Polling @ 20s)| UI_Dash
    UI_Dash --> WQI_Engine
    UI_Dash --> AI_Engine
    UI_Dash --> UI_Charts
    UI_Dash --> Alert_Sys
    UI_Dash --> Report_Sys
```

---

## 3. Hardware Component Specifications & Circuit Interfacing

| Component | Model / Type | Operating Voltage | Interface Type | Safe Operating Range (Effluent) |
| :--- | :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32 / NodeMCU ESP8266 | 3.3V / 5V USB | Wi-Fi 2.4 GHz | -40°C to +85°C |
| **pH Sensor** | Analog pH Sensor Kit (Glass Electrode) | 5.0V | Analog Output (GPIO 34) | 6.5 – 8.5 pH |
| **TDS Sensor** | Analog TDS Conductivity Meter Kit | 3.3V – 5.5V | Analog Output (GPIO 35) | 0 – 500 ppm |
| **Turbidity Sensor** | Optoelectronic Turbidity Sensor (TS-300B) | 5.0V | Analog Output (GPIO 32) | 0 – 100 NTU (Effluent Safe) |
| **Temperature Sensor**| DS18B20 Waterproof Probe | 3.0V – 5.5V | 1-Wire Digital (GPIO 4) + 4.7kΩ pull-up | 20°C – 35°C |
| **Audible Indicator** | Active Piezo Buzzer (5V) | 3.3V – 5.0V | Digital GPIO (GPIO 18) | Activated on Critical Breach |
| **Status LEDs** | Dual Bi-Color LEDs (Red/Green) | 3.3V via 220Ω | Digital GPIO (GPIO 19, 21) | Safe (Green) / Unsafe (Red) |

### 3.1 Pinout Assignment & Connections

```text
+-----------------------+------------------+-----------------------------+
| ESP32 Pin             | Connected Module | Description                 |
+-----------------------+------------------+-----------------------------+
| 3V3 / VIN             | VCC Pins         | Power rails (+3.3V / +5V)   |
| GND                   | Common Ground    | Ground reference            |
| GPIO 34 (ADC1_CH6)    | pH Sensor AOUT   | Analog voltage (0 - 3.3V)   |
| GPIO 35 (ADC1_CH7)    | TDS Sensor AOUT  | Analog voltage (0 - 3.3V)   |
| GPIO 32 (ADC1_CH4)    | Turbidity AOUT   | Phototransistor analog drop |
| GPIO 4  (Digital)     | DS18B20 Data     | 1-Wire bus with 4.7kΩ pullup|
| GPIO 18 (Digital Out) | Buzzer Positive  | High triggers local alarm   |
| GPIO 19 (Digital Out) | Green LED (Safe) | Illuminates when status = 0 |
| GPIO 21 (Digital Out) | Red LED (Unsafe) | Illuminates when status = 1 |
+-----------------------+------------------+-----------------------------+
```

---

## 4. Cloud Integration & Telemetry Pipeline (ThingSpeak)

The telemetry architecture uses **ThingSpeak IoT REST Services** for real-time cloud data ingress and public/private channel querying.

### 4.1 REST API Feeds Endpoint
- **URL Format:** `https://api.thingspeak.com/channels/{CHANNEL_ID}/feeds.json?results={N}`
- **Active Channel ID:** `3408255`
- **Default Result Limit:** `100` feeds per batch request
- **Client Polling Interval:** 20 seconds (configurable via UI countdown loop)

### 4.2 Cloud Field Mapping Definition

| Field Name | Physical Metric | Data Type | Engineering Units | Safe Threshold | Unsafe Condition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `field1` | pH Value | Float (`%.2f`) | pH scale (0–14) | $6.5 \le \text{pH} \le 8.5$ | $\text{pH} < 6.5$ or $\text{pH} > 8.5$ |
| `field2` | Total Dissolved Solids | Float / Integer | ppm (parts per million) | $\le 500\text{ ppm}$ | $> 500\text{ ppm}$ |
| `field3` | Turbidity | Float (`%.2f`) | NTU (Nephelometric Units)| $\le 100\text{ NTU}$ | $> 100\text{ NTU}$ |
| `field4` | Temperature | Float (`%.2f`) | °C (Celsius) | $\le 35\text{ }^\circ\text{C}$ | $> 35\text{ }^\circ\text{C}$ |
| `field5` | Overall Hardware Status | Integer | Binary flag | `0` (SAFE) | `1` (UNSAFE) |

---

## 5. Mathematical Models & Algorithmic Logic

### 5.1 Water Quality Index (WQI) Formulation
The dashboard implements a weighted arithmetic index model to compute an aggregate Water Quality Index ($0 \le \text{WQI} \le 100$) based on international standards (CPCB and WHO):

$$\text{WQI} = \sum_{i=1}^{n} (Q_i \times W_i) = (Q_{\text{pH}} \times 0.35) + (Q_{\text{TDS}} \times 0.20) + (Q_{\text{turb}} \times 0.30) + (Q_{\text{temp}} \times 0.15)$$

#### Sub-Index Quality Computations ($Q_i$):
1. **pH Sub-index ($Q_{\text{pH}}$):**
   $$Q_{\text{pH}} = \max\left(0, \min\left(100, 100 - \frac{|\text{pH} - 7.0|}{3.5} \times 100\right)\right)$$
2. **TDS Sub-index ($Q_{\text{TDS}}$):**
   $$Q_{\text{TDS}} = \begin{cases} 100 & \text{if } \text{TDS} \le 300\text{ ppm} \\ \max\left(0, \min\left(100, 100 - \frac{\text{TDS} - 300}{1000} \times 100\right)\right) & \text{if } \text{TDS} > 300\text{ ppm} \end{cases}$$
3. **Turbidity Sub-index ($Q_{\text{turb}}$):**
   $$Q_{\text{turb}} = \max\left(0, \min\left(100, 100 - \frac{\text{turb}}{15} \times 100\right)\right)$$
4. **Temperature Sub-index ($Q_{\text{temp}}$):**
   $$Q_{\text{temp}} = \max\left(0, \min\left(100, 100 - \frac{|\text{temp} - 24|}{20} \times 100\right)\right)$$

### 5.2 WQI Classification Categories

| Score Range | Water Quality Classification | Dashboard Badge Style | Recommended Operational Action |
| :--- | :--- | :--- | :--- |
| **85 – 100** | **Excellent Quality** | `wqi-excellent` (Emerald) | Effluent meets safe discharge standards. Sluice valve open. |
| **70 – 84** | **Good Quality** | `wqi-good` (Green) | Within acceptable limits. Safe for municipal sewer release. |
| **50 – 69** | **Moderate Quality** | `wqi-moderate` (Amber) | Mild pollution. Primary mechanical filtration recommended. |
| **35 – 49** | **Poor Wastewater** | `wqi-poor` (Orange) | Heavily contaminated. Engage neutralizing agents & flocculants. |
| **0 – 34** | **Critical Hazard** | `wqi-critical` (Red) | Severe hazard. Lock outflow gates; route to recycling chamber. |

### 5.3 Edge AI Rule-Based Classifier & Prescriptive Treatment
The system incorporates an automated inference engine that evaluates multi-variable parameter patterns:
1. **Acidic Mineralized Runoff:** Triggered if $\text{pH} < 5.0$ and $\text{TDS} > 500\text{ ppm}$.
   - *Action:* Dose Sodium Hydroxide ($\text{NaOH}$) chemical buffer; engage secondary membrane filters.
2. **Hot Alkaline Effluent Spill:** Triggered if $\text{pH} > 9.5$ and $\text{Temperature} > 35^\circ\text{C}$.
   - *Action:* Divert stream to cooling aeration basin; inject dilute acid neutralizer.
3. **High-Suspended Sludge Load:** Triggered if $\text{Turbidity} > 12\text{ NTU}$ and $\text{TDS} > 500\text{ ppm}$.
   - *Action:* Trigger automatic polymer flocculation block; check primary settling clarifier tanks.
4. **Purified Water Standard:** Triggered when all 4 parameters are within nominal thresholds.
   - *Action:* Normal operation; compliance verified.

---

## 6. Frontend Architecture & Module Breakdown

The dashboard is built using modern semantic HTML5, glassmorphic dark-theme CSS3 (`style.css`), and object-oriented vanilla JavaScript (`script.js`):

```text
IoT-Based-Industrial-Wastewater-Quality-Monitoring-and-Alert-System/
├── index.html          # Semantic Single-Page Application (SPA) container
├── style.css           # Glassmorphism dark UI, animations, responsive grid
├── script.js           # ThingSpeak REST consumer, WQI engine, Chart.js managers
└── README.md           # Quickstart & project overview
```

### 6.1 UI Modules & Navigation
1. **Telemetry Dashboard:**
   - 4 Real-time Sensor Cards (pH, TDS, Turbidity, Temperature) featuring animated value meters, threshold safety badges, and timestamp counters.
   - Dual header indicators: Cloud Connection Status (`Cloud Online` / `Cloud Error`) and Factory Hardware Status (`Sys Safe` / `Sys Unsafe` / `Sys Offline`).
   - SVG Circular WQI Gauge showing real-time composite score.
   - Edge AI Decision Card showing confidence percentage and recommended operational steps.
   - Emergency banner and audio chime upon critical threshold violations.
2. **Analytics & Historical Trends:**
   - 5 Chart.js dynamic visualizations:
     - pH Level Trend
     - TDS Trend (ppm)
     - Turbidity Trend (NTU)
     - Water Temperature Trend (°C)
     - System Status Step Trend (`0 = SAFE`, `1 = UNSAFE`)
   - Rolling 50-sample timeframe with responsive gradient backdrops.
3. **Alerts & Threshold Logs:**
   - Categorized alert cards with timestamp, description, and status icons.
   - Filter buttons: *All Alerts*, *Critical*, *Warning*, *Safe/Info*.
   - History clearance button and audio alert toggle switch.
4. **Monitoring Reports:**
   - Statistical Aggregate Matrix: Mean, Minimum, Maximum, and Current values against regulatory benchmarks.
   - Historical tabular log of received telemetry packets.
   - One-click CSV export with auto-generated timestamps.
   - Dedicated Print-to-PDF layout with formal audit headers, report IDs, and supervisor sign-off lines.
5. **System Status & Configuration:**
   - Dynamic Channel ID and Read API Key configuration form saved to browser `localStorage`.
   - Node Diagnostics indicating live telemetry transmission per individual sensor probe.

---

## 7. Installation, Setup & How-To-Run Guide

### 7.1 Prerequisites
- Modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari).
- Local HTTP server (recommended) such as VS Code Live Server, Python `http.server`, or Node.js `http-server`.

### 7.2 Running Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/ChiragD2109/IoT-Based-Industrial-Wastewater-Quality-Monitoring-and-Alert-System.git
   cd IoT-Based-Industrial-Wastewater-Quality-Monitoring-and-Alert-System
   ```
2. Start a local HTTP server:
   - **Using Python 3:**
     ```bash
     python -m http.server 8000
     ```
   - **Using VS Code:** Right-click `index.html` and select **"Open with Live Server"**.
3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```
4. The dashboard will automatically connect to ThingSpeak Channel `3408255` and begin streaming live telemetry.

---

## 8. Embedded Firmware Reference (ESP32 / ESP8266)

Below is the production-grade Arduino C++ firmware template for the ESP32 transmitter node:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Wi-Fi Credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ThingSpeak Channel Configuration
const char* server = "http://api.thingspeak.com";
const char* writeAPIKey = "YOUR_THINGSPEAK_WRITE_API_KEY";

// Sensor Pin Definitions
#define PH_PIN 34
#define TDS_PIN 35
#define TURBIDITY_PIN 32
#define ONE_WIRE_BUS 4
#define BUZZER_PIN 18
#define LED_SAFE_PIN 19
#define LED_UNSAFE_PIN 21

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);

// Threshold Constants
const float PH_MIN_SAFE = 6.5;
const float PH_MAX_SAFE = 8.5;
const float TDS_MAX_SAFE = 500.0;
const float TURB_MAX_SAFE = 100.0;
const float TEMP_MAX_SAFE = 35.0;

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_SAFE_PIN, OUTPUT);
  pinMode(LED_UNSAFE_PIN, OUTPUT);
  
  tempSensors.begin();
  
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Connected successfully.");
}

void loop() {
  // 1. Read Physical Sensors
  // Analog pH computation (Calibrated slope)
  int phRaw = analogRead(PH_PIN);
  float phVoltage = (phRaw / 4095.0) * 3.3;
  float phVal = 7.0 + ((2.5 - phVoltage) * 3.5);

  // Analog TDS computation
  int tdsRaw = analogRead(TDS_PIN);
  float tdsVoltage = (tdsRaw / 4095.0) * 3.3;
  float tdsVal = (133.42 * pow(tdsVoltage, 3) - 255.86 * pow(tdsVoltage, 2) + 857.39 * tdsVoltage) * 0.5;

  // Analog Turbidity computation
  int turbRaw = analogRead(TURBIDITY_PIN);
  float turbVoltage = (turbRaw / 4095.0) * 3.3;
  float turbVal = -1120.4 * pow(turbVoltage, 2) + 5742.3 * turbVoltage - 4352.9;
  if (turbVal < 0) turbVal = 0;

  // Digital Temperature computation
  tempSensors.requestTemperatures();
  float tempVal = tempSensors.getTempCByIndex(0);

  // 2. Evaluate Safety Thresholds (Field 5: 0 = SAFE, 1 = UNSAFE)
  int hwStatus = 0;
  if (phVal < PH_MIN_SAFE || phVal > PH_MAX_SAFE || 
      tdsVal > TDS_MAX_SAFE || turbVal > TURB_MAX_SAFE || 
      tempVal > TEMP_MAX_SAFE) {
    hwStatus = 1; // Unsafe condition detected
  }

  // Actuate Local Alert Peripherals
  if (hwStatus == 1) {
    digitalWrite(BUZZER_PIN, HIGH);
    digitalWrite(LED_UNSAFE_PIN, HIGH);
    digitalWrite(LED_SAFE_PIN, LOW);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_UNSAFE_PIN, LOW);
    digitalWrite(LED_SAFE_PIN, HIGH);
  }

  // 3. Transmit Payload to ThingSpeak
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(server) + "/update?api_key=" + writeAPIKey +
                 "&field1=" + String(phVal, 2) +
                 "&field2=" + String(tdsVal, 0) +
                 "&field3=" + String(turbVal, 2) +
                 "&field4=" + String(tempVal, 2) +
                 "&field5=" + String(hwStatus);

    http.begin(url);
    int httpResponseCode = http.GET();
    Serial.printf("ThingSpeak HTTP Response: %d | Status: %s\n", 
                  httpResponseCode, (hwStatus == 1 ? "UNSAFE" : "SAFE"));
    http.end();
  }

  // ThingSpeak rate-limiting interval (minimum 15-20 seconds)
  delay(20000);
}
```

---

## 9. Regulatory Reference Standards

The safe parameter boundaries incorporated into this project are derived from the following national and international environmental guidelines:

| Parameter | CPCB Effluent Standards (Inland Surface Water) | WHO Drinking / Discharge Guidelines | Project Threshold Set |
| :--- | :--- | :--- | :--- |
| **pH Value** | $5.5 - 9.0$ | $6.5 - 8.5$ | **6.5 – 8.5** |
| **TDS** | $2100\text{ mg/L}$ max | $500\text{ mg/L}$ desirable | **$\le 500\text{ ppm}$** |
| **Turbidity** | $100\text{ NTU}$ (Industrial) | $5\text{ NTU}$ (Treated) | **$\le 100\text{ NTU}$** |
| **Temperature** | Shall not exceed $5^\circ\text{C}$ above receiving water temp | Max $35^\circ\text{C}$ | **$\le 35^\circ\text{C}$** |

---

## 10. References & Literature

1. V. Lakshmikantha, A. Hiriyannagowda, A. Manjunath, A. Patted, J. Basavaiah, and A. A. Anthony, *"IoT based smart water quality monitoring system,"* *Discover Applied Sciences*, vol. 6, no. 2, 2024.
2. E. E.-D. Hemdan, Y. M. Essa, M. Shouman, A. El-Sayed, and A. N. Moustafa, *"An efficient IoT based smart water quality monitoring system,"* *Environmental Monitoring and Assessment*, vol. 195, no. 4, 2023.
3. M. A. Murti, A. R. A. Saputra, I. Alinursafa, A. N. Ahmed, A. Yafouz, and A. El-Shafie, *"Smart system for water quality monitoring utilizing long-range-based Internet of Things,"* *Environmental Monitoring and Assessment*, vol. 196, no. 4, 2024.
4. N. Chavhan, R. Bhattad, S. Khot, S. Patil, A. Pawar, T. Pawar, and P. Gawli, *"APAH: An autonomous IoT driven real-time monitoring system for industrial wastewater,"* *Results in Engineering*, vol. 21, 2024.
5. H. M. Forhad, M. R. Uddin, R. S. Chakrovorty, et al., *"IoT based real-time water quality monitoring system in water treatment plants (WTPs),"* *Heliyon*, vol. 10, Art. no. e40746, 2024.
6. S. Govinda Rao, V. V. R. Raju, D. S. Harshitha, S. Vasundhara, T. Modhita, and P. Vijaya Lakshmi, *"IoT-based Water Quality Monitoring using ESP32,"* in *Proc. 8th Int. Conf. Computing Methodologies and Communication (ICCMC)*, IEEE, 2025, pp. 470–476.
7. R. K. Nishan, S. Akter, R. I. Sony, M. M. Hoque, M. J. Anee, and A. Hossain, *"Development of an IoT-based multi-level system for real-time water quality monitoring in industrial wastewater,"* *Discover Water*, vol. 4, Art. no. 43, 2024.
