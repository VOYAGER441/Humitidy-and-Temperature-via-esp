#include "DHT.h"
#include <WiFi.h>
#include <HTTPClient.h>

// DHT22 Setup
#define DHTPIN 16         // GPIO pin where DHT22 data line is connected
#define DHTTYPE DHT22     // DHT22 sensor
DHT dht(DHTPIN, DHTTYPE);

// WiFi credentials
const char* ssid = "CirkitWifi";
const char* password = "";

// API endpoint
const char* serverName = "https://your-api.com/api/data";  // Replace with your API URL
const char* apiKey = "your_api_key";  // If your API requires authentication

// Timing variables
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 5000;  // 5000 ms = 5 sec

void setup() {
  Serial.begin(115200);
  delay(100);
  
  // Initialize DHT sensor
  dht.begin();
  Serial.println("DHT22 Initialized");
  
  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Check if it's time to send data (every 1 minute)
  if (millis() - lastSendTime >= sendInterval) {
    lastSendTime = millis();
    
    // Read temperature and humidity
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();  // Celsius
    
    // Check if readings are valid
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor!");
    } else {
      Serial.print("Temperature: ");
      Serial.print(temperature);
      Serial.print("°C, Humidity: ");
      Serial.print(humidity);
      Serial.println("%");
      
      // Send data to API
      sendDataToAPI(temperature, humidity);
    }
  }
}

void connectToWiFi() {
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Failed to connect to WiFi");
  }
}

void sendDataToAPI(float temp, float humidity) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Create JSON payload
    String jsonPayload = "{\"temperature\":" + String(temp) + ",\"humidity\":" + String(humidity) + "}";
    
    // Option 1: POST request with JSON
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP Response Code: ");
      Serial.println(httpResponseCode);
      Serial.print("Response: ");
      Serial.println(response);
    } else {
      Serial.print("Error sending POST request: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
    
    /* Option 2: GET request (uncomment to use instead)
    String url = String(serverName) + "?temperature=" + String(temp) + "&humidity=" + String(humidity) + "&apiKey=" + String(apiKey);
    http.begin(url);
    int httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP Response Code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
    */
    
  } else {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
}