#include <WiFi.h>
#include "time.h"
#include <HTTPClient.h>
#include <iostream>
#include <string>
#include <OneWire.h>
#include <DallasTemperature.h>

//Used to Connect to Wi-Fi. Computer and sensors should be on the same network
//Change the ipaddress in serverName to your ipaddress. Run ipconfig in cmd.
const char* ssid = "pee poo poo pee"; 
const char* password = "hahahatdog";
const char* ntpServer = "pool.ntp.org";
const char* ntpServer2 = "time.nist.gov";
const char* serverName = "http://192.168.150.125:8000/sensors/upload-data";
HTTPClient http;
WiFiClient client;

//Define pins of sensors
#define TDSPin 33
#define PHPin 35
#define DOPin 32
#define TempPin 23

const float x_slope = -5.0043;
const float b_slope = 18.961;
const float final_x = 0.9815;
const float final_b = 0.094;
const int numReadings = 10;

//Used in pH
float pHreadings[numReadings];
int pH_readIndex = 0;
float pH_total = 0.0;
float pH_Average = 0.0;
int pH_rawValue = 0;
float phVoltage;
float phValue;
float pH_finalValue;
String phPayload;
int phResponseCode;
float finalpH;
float calibratedpH;

//Used in TDS
int tdsReadings[numReadings];
int tds_readIndex = 0;
int tds_total = 0;
int tds_average = 0;
int tds_rawValue = 0;
int tds_finalValue;
#define VREF_TDS 3.3      // analog reference voltage(Volt) of the ADC
#define SCOUNT 30           // sum of sample point
int analogBuffer[SCOUNT];    // store the analog value in the array, read from ADC
int analogBufferTemp[SCOUNT];
int analogBufferIndex = 0,copyIndex = 0;
float averageVoltage = 0,tdsValue = 0,temperature = 25;
float compensationCoefficient;
float compensationVoltage;
String tdsPayload;
int tdsResponseCode;
String tds_response;

//Used in DO
int doxReadings[numReadings];
int dox_readIndex = 0;
int dox_total = 0;
float dox_average = 0.0;
int dox_rawValue = 0;
#define VREF_DO 5000//VREF(mv)
#define ADC_RES 1024//ADC Resolution
float dox_voltage;
float dox_finalValue;
String doPayload;
int doResponseCode;
String dox_response;

//Used in Temp
int tempReadings[numReadings];
int temp_readIndex = 0;
int temp_total = 0;
int temp_average = 0;
float temp_rawValue = 0;   
float temp_finalValue = 0;
int tempResponseCode = 0;
String tempPayload = "";
String tempResponse = "";
OneWire oneWire(TempPin); // Setup a oneWire instance to communicate with any OneWire devices
DallasTemperature sensors(&oneWire); // Pass our oneWire reference to Dallas Temperature sensor 


void setup() {
  // Serial.begin(9600);
  Serial.begin(115200);

  WiFi.begin(ssid, password);

  //Comment out when not connecting to wifi
  // while (WiFi.status() != WL_CONNECTED) {
  //   delay(500);
  // }

  Serial.println("Wifi Connected");
  configTime(28800, 0, ntpServer, ntpServer2);

  // Start the sensors
  sensors.begin();
  pinMode(TDSPin,INPUT);
  pinMode(PHPin,INPUT);
  pinMode(DOPin,INPUT);
  
  for(int i =0; i < numReadings; i++){
    pHreadings[i] = 0.0;
    tdsReadings[i] = 0;
    doxReadings[i] = 0;
    tempReadings[i] = 0;
  }

}

void loop() {
  // if (WiFi.status() == WL_CONNECTED) {
    // pH_rawValue = analogRead(PHPin);
    // pH_finalValue = pHReading(pH_rawValue);
  //   UploadpHReading(pH_finalValue);

  //   tds_rawValue = analogRead(TDSPin);
  //   tds_finalValue = tdsReading(tds_rawValue);

  //   dox_rawValue = analogRead(DOPin);
  //   dox_finalValue = doxReading(dox_rawValue);
  //   UploadDOReading(dox_finalValue);

  //   sensors.requestTemperatures();
  //   temp_rawValue = sensors.getTempCByIndex(0);
  //   temp_finalValue = tempReading(temp_rawValue);
  //   UploadTempReading(temp_finalValue);
  // }

  // //Indiv testing without Wi-fi
  tds_rawValue = analogRead(TDSPin);
  tds_finalValue = tdsReading(tds_rawValue);

  dox_rawValue = analogRead(DOPin);
  dox_finalValue = doxReading(dox_rawValue);

  sensors.requestTemperatures();
  temp_rawValue = sensors.getTempCByIndex(0);
  temp_finalValue = tempReading(temp_rawValue);
  
  pH_rawValue = analogRead(PHPin);
  pH_finalValue = pHReading(pH_rawValue);

  delay (1000);
}


float pHReading(int value) {
  float pH_voltage = 0.0;
  
  // Subtract old reading
  pH_total = pH_total - pHreadings[pH_readIndex];
  
  // Add new reading
  pHreadings[pH_readIndex] = (float)value;  // Cast to float when storing
  pH_total = pH_total + pHreadings[pH_readIndex];
  
  // Move to next position
  pH_readIndex++;
  if(pH_readIndex >= numReadings) {
    pH_readIndex = 0;
  }

  // Calculate average
  pH_Average = pH_total / (float)numReadings;  // Cast numReadings to float for division

  //Serial.println("pH Raw ADC: " + String(pH_Average));
  
  // Calculate voltage (using 3.3V reference)
  pH_voltage = pH_Average * (3.3 / 4095.0);
  //Serial.println("pH voltage: " + String(pH_voltage, 4));  // Show 4 decimal places for voltage

  // Apply two-point calibration
  float calibratedpH = (x_slope * pH_voltage) + b_slope;
  float finalpH = (final_x * calibratedpH) + final_b;

  //Serial.println("Calibrated pH: " + String(calibratedpH, 3));  // Show intermediate value
  Serial.println("Final pH: " + String(finalpH, 3) + "\n");     // Show final value
  
  return finalpH;
}

int tdsReading (int value){
  // tds_total = tds_total - tdsReadings[tds_readIndex];
  // tdsReadings[tds_readIndex] = value;
  // tds_total = tds_total + tdsReadings[tds_readIndex];
  // tds_readIndex++;

  // if(tds_readIndex >= numReadings) {
  //   tds_readIndex = 0;
  // }

  // tds_average = tds_total / numReadings;

  // Serial.println("TDS Raw ADC: " + String(tds_average));

  // ** Read TDS Sensor Values **
  static unsigned long analogSampleTimepoint = millis();
  if (millis() - analogSampleTimepoint > 40U) {
    analogSampleTimepoint = millis();
    analogBuffer[analogBufferIndex] = value; 
    analogBufferIndex++;
    
    if (analogBufferIndex == SCOUNT) {
      analogBufferIndex = 0;
    }
  }  

  static unsigned long printTimepoint = millis();
  if (millis() - printTimepoint > 800U) {
    printTimepoint = millis();
    for (copyIndex = 0; copyIndex < SCOUNT; copyIndex++) {
        analogBufferTemp[copyIndex] = analogBuffer[copyIndex];
    }

    averageVoltage = getMedianNum(analogBufferTemp, SCOUNT) * (float)VREF_TDS / ADC_RES;
    compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0); 
    compensationVoltage = averageVoltage / compensationCoefficient; 
    tdsValue = (133.42 * compensationVoltage * compensationVoltage * compensationVoltage -
                255.86 * compensationVoltage * compensationVoltage +
                857.39 * compensationVoltage) * 0.5;
    Serial.print("TDS Value: ");
    Serial.print(tdsValue, 0);
    Serial.println(" ppm");
  }

  return tdsValue;
}

float doxReading (int value){
  //dox_voltage = value * VREF_DO / ADC_RES;
  dox_total = dox_total - doxReadings[dox_readIndex];
  doxReadings[dox_readIndex] = value;
  //doxReadings[dox_readIndex] = dox_voltage;
  dox_total = dox_total + doxReadings[dox_readIndex];
  dox_readIndex++;

  if(dox_readIndex >= numReadings) {
    dox_readIndex = 0;
  }

  dox_average = dox_total / numReadings;

  //Serial.println("DO Raw ADC: " + String(dox_average));
  Serial.println("DO Value: " + String(dox_average/10.0));

  return dox_average;
}

float tempReading (float value){
  temp_total = temp_total - tempReadings[temp_readIndex];
  tempReadings[temp_readIndex] = value;
  temp_total = temp_total + tempReadings[temp_readIndex];
  temp_readIndex++;

  if(temp_readIndex >= numReadings) {
    temp_readIndex = 0;
  }

  temp_average = temp_total / numReadings;

  Serial.println("Temp Raw ADC: " + String(temp_average));
  
  return temp_average;
}

void UploadTempReading (float finalTemp){
  http.begin(client, serverName);
  http.addHeader("Content-Type", "application/json");
  tempPayload = "{\"station\": \"I\", \"sensor\": \"temperature\", \"value\": \"" + String(finalTemp, 2) + "\"}";
  tempResponseCode = http.POST(tempPayload);
  Serial.println("Temperature Payload: " + tempPayload);
  Serial.println("Response Code: " + String(tempResponseCode));
  
  if (tempResponseCode > 0) {
    tempResponse = http.getString();
    Serial.println("Server Response: " + tempResponse + "\n");
  } 
  else {
    Serial.println("Error in Temperature HTTP Request: " + http.errorToString(tempResponseCode) + "\n");
  }
  http.end();
}

void UploadpHReading (float finalpH){
  http.begin(client, serverName);
  http.addHeader("Content-Type", "application/json");
  phPayload = "{\"station\": \"I\", \"sensor\": \"pH\", \"value\": \"" + String(finalpH, 2) + "\"}";
  phResponseCode = http.POST(phPayload);
  Serial.println("pH Payload: " + phPayload);
  
  if (phResponseCode > 0) {
    Serial.println("Server Response: " + http.getString());
  } 
  else {
    Serial.println("Error in pH HTTP Request: " + http.errorToString(phResponseCode) + "\n");
  }
  http.end();
}

void UploadDOReading (float finalDO){
  http.begin(client, serverName);
  http.addHeader("Content-Type", "application/json");
  doPayload = "{\"station\": \"I\", \"sensor\": \"DO\", \"value\": \"" + String(finalDO, 2) + "\"}";
  Serial.println("DO Payload: " + doPayload);
  doResponseCode = http.POST(doPayload);

  if (doResponseCode > 0) {
    dox_response = http.getString();
    Serial.println("Server Response: " + dox_response + "\n");
  } else {
    Serial.println("Error in DO HTTP Request: " + http.errorToString(doResponseCode) + "\n");
  }

  http.end();
}

void UploadTDSReading (int finalTDS){
  http.begin(client, serverName);
  http.addHeader("Content-Type", "application/json");
  tdsPayload = "{\"station\": \"I\", \"sensor\": \"TDS\", \"value\": \"" + String(finalTDS, 0) + "\"}";
  tdsResponseCode = http.POST(tdsPayload);
  Serial.println("TDS Payload: " + tdsPayload);
  Serial.println("Response Code: " + String(tdsResponseCode));
  
  if (tdsResponseCode > 0) {
    tds_response = http.getString();
    Serial.println("Server Response: " + tds_response + "\n");
  } 
  else {
    Serial.println("Error in TDS HTTP Request: " + http.errorToString(tdsResponseCode) + "\n");
  }
  http.end();
}

int getMedianNum(int bArray[], int iFilterLen) {
  int bTab[iFilterLen];
  
  for (byte i = 0; i<iFilterLen; i++)
  
  bTab[i] = bArray[i];
  
  int i, j, bTemp;
  
  for (j = 0; j < iFilterLen - 1; j++) {
    for (i = 0; i < iFilterLen - j - 1; i++) {
      if (bTab[i] > bTab[i + 1]) {
        bTemp = bTab[i];
        bTab[i] = bTab[i + 1];
        bTab[i + 1] = bTemp;
      }
    }
  }

  if ((iFilterLen & 1) > 0) {
    bTemp = bTab[(iFilterLen - 1) / 2];
  }
  else{
    bTemp = (bTab[iFilterLen / 2] + bTab[iFilterLen / 2 - 1]) / 2;
  }
  
  return bTemp;
}