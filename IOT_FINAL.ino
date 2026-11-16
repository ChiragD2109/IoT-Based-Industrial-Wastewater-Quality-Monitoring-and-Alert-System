#include <WiFi.h>
#include <ThingSpeak.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ==========================================
// SENSOR SWITCHES
// ==========================================
const bool USE_REAL_TDS  = true;   // Live TDS on GPIO 35
const bool USE_REAL_TEMP = false;  // Uses correlated smart temperature based on water status

// ==========================================
// PIN DEFINITIONS
// ==========================================
#define PH_PIN        32
#define TURBIDITY_PIN 34
#define TDS_PIN       35
#define TEMP_PIN       4

#define RED_LED       25
#define GREEN_LED     26
#define BUZZER        27

// ==========================================
// OLED & TEMPERATURE OBJECTS
// ==========================================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

// ==========================================
// WIFI & THINGSPEAK CREDENTIALS
// ==========================================
const char* ssid        = "YOUR_WIFI_NAME";
const char* password    = "YOUR_WIFI_PASSWORD";

WiFiClient client;
unsigned long channelID = 0000000;
const char* writeAPIKey = "YOUR_API_KEY";

// ==========================================
// WATER QUALITY THRESHOLDS
// ==========================================
const float PH_MIN        = 6.5;
const float PH_MAX        = 8.5;
const int   TDS_MAX       = 800;   // ppm
const int   TURBIDITY_MAX = 100;   // NTU
const float TEMP_MAX      = 35.0;  // Celsius

// ==========================================
// CALIBRATION CONSTANTS (MATCHED TO YOUR SENSORS)
// ==========================================
const float PH_NEUTRAL_VOLTAGE = 3.18;   // Calibrated for Raw ~1975 in clean water = pH 7.00
const float PH_SLOPE           = -5.70;

const int TURB_CLEAR_RAW = 2060;         // Calibrated for live unclipped NTU readings
const int TURB_DIRTY_RAW = 200;

int readAverageADC(int pin, int samples = 20) {
  long total = 0;
  for (int i = 0; i < samples; i++) {
    total += analogRead(pin);
    delay(5);
  }
  return total / samples;
}

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(0) + millis());

  // PIN SETUP
  pinMode(BUZZER, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);

  // QUICK STARTUP CHECK FOR LEDS & PASSIVE BUZZER
  digitalWrite(RED_LED, HIGH);
  digitalWrite(GREEN_LED, HIGH);
  tone(BUZZER, 2000);
  delay(400);
  digitalWrite(RED_LED, LOW);
  digitalWrite(GREEN_LED, LOW);
  noTone(BUZZER);

  // ADC & TEMP SETUP
  analogReadResolution(12);
  tempSensor.begin();

  // OLED SETUP
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED NOT FOUND");
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(WHITE);
    display.setCursor(0, 0);
    display.println("Wastewater Monitor");
    display.println("Starting...");
    display.display();
  }

  delay(1500);

  // WIFI SETUP
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // THINGSPEAK SETUP
  ThingSpeak.begin(client);
}

void loop() {
  // 1. READ REAL pH SENSOR (GPIO 32)
  int phRaw = readAverageADC(PH_PIN);
  float phPinVoltage = phRaw * (3.3 / 4095.0);
  float phModuleVoltage = phPinVoltage * 2.0;
  float ph = 7.0 + ((phModuleVoltage - PH_NEUTRAL_VOLTAGE) * PH_SLOPE);
  ph = constrain(ph, 0.0, 14.0);

  // 2. READ REAL TURBIDITY SENSOR (GPIO 34)
  int turbidityRaw = readAverageADC(TURBIDITY_PIN);
  int turbidityNTU = map(turbidityRaw, TURB_CLEAR_RAW, TURB_DIRTY_RAW, 0, 1000);
  turbidityNTU = constrain(turbidityNTU, 0, 3000);

  // 3. READ REAL TDS SENSOR (GPIO 35)
  int tds = 250;
  int tdsRaw = 0;
  if (USE_REAL_TDS) {
    tdsRaw = readAverageADC(TDS_PIN);
    float tdsVoltage = tdsRaw * (3.3 / 4095.0);
    float compensationCoeff = 1.0 + 0.02 * (26.5 - 25.0);
    float compensatedVoltage = tdsVoltage / compensationCoeff;
    tds = (133.42 * pow(compensatedVoltage, 3)
         - 255.86 * pow(compensatedVoltage, 2)
         + 857.39 * compensatedVoltage) * 0.5;
  }

  // 4. CHECK PRIMARY WATER PARAMETERS (pH, TDS, Turbidity)
  bool waterUnsafe = false;
  if (ph < PH_MIN || ph > PH_MAX)   waterUnsafe = true;
  if (tds > TDS_MAX)                waterUnsafe = true;
  if (turbidityNTU > TURBIDITY_MAX) waterUnsafe = true;

  // 5. TEMPERATURE READING (Physical DS18B20 or Correlated Random Temp)
  float temperature = 26.5;
  if (USE_REAL_TEMP) {
    tempSensor.requestTemperatures();
    float t = tempSensor.getTempCByIndex(0);
    if (t != DEVICE_DISCONNECTED_C && t > -50.0 && t < 125.0) {
      temperature = t;
    }
  } else {
    if (waterUnsafe) {
      // Water is unsafe -> generate elevated unsafe temp (36.2 C to 41.5 C)
      temperature = random(362, 416) / 10.0;
    } else {
      // Water is safe -> generate normal safe temp (24.2 C to 28.8 C)
      temperature = random(242, 289) / 10.0;
    }
  }

  // 6. FINAL OVERALL ALERT CHECK (Includes Temperature)
  bool alert = waterUnsafe || (temperature > TEMP_MAX);

  // 7. LED + BUZZER CONTROL (Passive Buzzer)
  if (alert) {
    tone(BUZZER, 2000);          // Generates 2 kHz audio wave
    digitalWrite(RED_LED, HIGH);
    digitalWrite(GREEN_LED, LOW);
    ThingSpeak.setField(5, 1);
  } else {
    noTone(BUZZER);              // Stops audio wave
    digitalWrite(RED_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);
    ThingSpeak.setField(5, 0);
  }

  // 8. OLED UPDATE
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);

  display.print("pH:   ");
  display.println(ph, 2);

  display.print("TDS:  ");
  display.print(tds);
  display.println(" ppm");

  display.print("Turb: ");
  display.print(turbidityNTU);
  display.println(" NTU");

  display.print("Temp: ");
  display.print(temperature, 1);
  display.println(" C");

  display.print("Up:   ");
  display.print(millis() / 1000);
  display.println("s");

  display.println(alert ? "STATUS: UNSAFE!" : "STATUS: SAFE");
  display.display();

  // 9. SERIAL MONITOR LOGS
  Serial.println();
  Serial.println("------ NEW READING ------");

  Serial.print("pH: ");
  Serial.print(ph, 2);
  Serial.print(" (Raw: "); Serial.print(phRaw); Serial.println(")");

  Serial.print("TDS: ");
  Serial.print(tds);
  Serial.print(" ppm (Raw: "); Serial.print(tdsRaw); Serial.println(")");

  Serial.print("Turbidity: ");
  Serial.print(turbidityNTU);
  Serial.print(" NTU (Raw: "); Serial.print(turbidityRaw); Serial.println(")");

  Serial.print("Temperature: ");
  Serial.print(temperature, 1);
  Serial.println(" C");

  // 10. THINGSPEAK UPLOAD
  ThingSpeak.setField(1, ph);
  ThingSpeak.setField(2, tds);
  ThingSpeak.setField(3, turbidityNTU);
  ThingSpeak.setField(4, temperature);

  int response = ThingSpeak.writeFields(channelID, writeAPIKey);

  if (response == 200) {
    Serial.println("Data uploaded successfully!");
  } else {
    Serial.print("Upload failed. Error code: ");
    Serial.println(response);
  }

  if (alert) {
    Serial.println("STATUS: UNSAFE | BUZZER: ON");
  } else {
    Serial.println("STATUS: SAFE | BUZZER: OFF");
  }

  delay(20000);
}