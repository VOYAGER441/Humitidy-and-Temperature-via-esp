/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TelemetryReading } from './types';

// Generate continuous climate data showing diurnal variations
export function generateMockHistory(hoursCount = 24, intervalMinutes = 5): TelemetryReading[] {
  const readings: TelemetryReading[] = [];
  const now = new Date();
  
  // Total points
  const pointsCount = Math.floor((hoursCount * 60) / intervalMinutes);
  
  for (let i = pointsCount - 1; i >= 0; i--) {
    const readingTime = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    const hour = readingTime.getHours();
    const minute = readingTime.getMinutes();
    
    // Diurnal temperature cycle: warmest at 3 PM (15), coolest at 6 AM (6)
    // Map hour to radians: (hour - 6) / 24 * 2 * PI
    const tempAngle = ((hour - 6 + minute / 60) / 24) * 2 * Math.PI;
    const baseTemp = 22.0 + 3.5 * Math.sin(tempAngle - Math.PI / 4); // Peak around 15:00
    
    // Add micro variations and progressive noise
    const randomNoise = Math.sin(i * 0.15) * 0.4 + (Math.random() - 0.5) * 0.3;
    const temperature = parseFloat((baseTemp + randomNoise).toFixed(1));
    
    // Humidity is generally inversely proportional to temperature (cooler is more humid)
    const baseHum = 65.0 - 15.0 * Math.sin(tempAngle - Math.PI / 4);
    const humNoise = Math.cos(i * 0.1) * 1.5 + (Math.random() - 0.5) * 1.0;
    const humidity = Math.max(10, Math.min(100, Math.round(baseHum + humNoise)));
    
    // Voltage: fluctuates between 3.28V and 3.33V
    const voltage = parseFloat((3.30 + Math.sin(i * 0.05) * 0.015 + Math.random() * 0.005).toFixed(2));
    
    // RSSI: wifi signal strength -35dBm to -65dBm
    const wifiRssi = Math.round(-45 + Math.sin(i * 0.03) * 8 + (Math.random() - 0.5) * 4);
    
    // Status assessment
    let status: TelemetryReading['status'] = 'NOMINAL';
    if (temperature > 25.5) status = 'WARM';
    else if (temperature < 19.0) status = 'COLD';
    else if (humidity > 70) status = 'HUMID';
    else if (humidity < 35) status = 'DRY';
    
    // Format label like "12:45"
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Simulated uptime (grows up)
    const uptime = i * intervalMinutes * 60;
    
    readings.push({
      timestamp: readingTime.toISOString(),
      timeLabel,
      temperature,
      humidity,
      voltage,
      wifiRssi,
      uptime,
      status,
      device: 'ESP32_WROOM_DA_01',
    });
  }
  
  return readings;
}

// Generate Arduino code block for physical ESP32 support
export const ESP32_CODE_TEMPLATE = `/*
  EcoMonitor ESP32 Client Code
  Upload this to your ESP32 connected to a DHT22 sensor to feed data!
  This script makes a POST request to your EcoMonitor endpoint.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Replace with your EcoMonitor deployed API URL
const char* serverName = "https://YOUR_APP_URL/api/telemetry";

unsigned long lastTime = 0;
unsigned long timerDelay = 60000; // Send telemetry every 1 min

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  WiFi.begin(ssid, password);
  Serial.println("Connecting to Wi-Fi");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Send an HTTP POST request every minutes
  if ((millis() - lastTime) > timerDelay) {
    if(WiFi.status() == WL_CONNECTED){
      HTTPClient http;
      
      http.begin(serverName);
      http.addHeader("Content-Type", "application/json");
      
      float t = dht.readTemperature();
      float h = dht.readHumidity();
      float voltage = 3.30 + ((float)random(-2, 3) / 100.0); // ESP32 core voltage simulator
      int rssi = WiFi.RSSI();
      unsigned long uptimeSeconds = millis() / 1000;
      
      if (isnan(t) || isnan(h)) {
        Serial.println("Failed to read from DHT sensor!");
        return;
      }
      
      // Construct JSON payload
      String jsonPayload = "{\\"temperature\\":" + String(t, 1) + 
                            ",\\"humidity\\":" + String((int)h) + 
                            ",\\"voltage\\":" + String(voltage, 2) + 
                            ",\\"wifiRssi\\":" + String(rssi) + 
                            ",\\"uptime\\":" + String(uptimeSeconds) + 
                            ",\\"device\\":\\"ESP32_ESP_LIVE_01\\"}";
      
      Serial.print("Sending: ");
      Serial.println(jsonPayload);
      
      int httpResponseCode = http.POST(jsonPayload);
      
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
        
      http.end();
    }
    else {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }
}
`;
