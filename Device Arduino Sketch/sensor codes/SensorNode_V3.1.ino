#include <Arduino.h>
#include <DallasTemperature.h>
#include <Preferences.h>
#include "GravityTDS.h"
Preferences prefs;
GravityTDS gravityTDS;

#define RXD2 16 // ESP32 RX (Connect to LoRa TX)
#define TXD2 17 // ESP32 TX (Connect to LoRa RX)

// Sensor pins
#define TDSPin 33
#define PHPin 35
#define DOPin 32
#define TempPin 23
#define orpPin 39
#define TurbPin 34  // Turbidity sensor pin
#define ADC_RES 4095 // ADC Resolution

// Constants
const int INITIAL_SAMPLES = 1;   // Initial test iterations //
const int NORMAL_SAMPLES = 10;    // Normal operation iterations //150
const int INITIAL_DELAY_MS = 1000; // Initial Testing Delay
const int SAMPLE_DELAY_MS = 1000; //200 Normal delay
const float VOLTAGE = 5.0;        // ORP system voltage
const int OFFSET = 369.28;             // ORP zero drift

// DO Sensor Constants
//#define VREF 5000    // VREF (mv)
#define TWO_POINT_CALIBRATION 0
float CAL1_V = 1600; // Default value
float CAL1_T = 25;
float CAL2_V = 1300;
float CAL2_T = 15;

// DO Lookup Table
const uint16_t DO_Table[41] = {
    14460, 14220, 13820, 13440, 13090, 12740, 12420, 12110, 11810, 11530,
    11260, 11010, 10770, 10530, 10300, 10080, 9860, 9660, 9460, 9270,
    9080, 8900, 8730, 8570, 8410, 8250, 8110, 7960, 7820, 7690,
    7560, 7430, 7300, 7180, 7070, 6950, 6840, 6730, 6630, 6530, 6410};

// State control
enum ProgramState {
  INITIAL_TEST,
  NORMAL_OPERATION
};
ProgramState currentState = INITIAL_TEST;
int iterationCounter = 0;

// ORP sensor
#define ORP_ARRAY_LENGTH 50
int orpArray[ORP_ARRAY_LENGTH];
int orpArrayIndex = 0;
float orpValue;

// Sensor data storage
float pH_samples[NORMAL_SAMPLES];
float tds_samples[NORMAL_SAMPLES];
float dox_samples[NORMAL_SAMPLES];
float temp_samples[NORMAL_SAMPLES];
float turb_samples[NORMAL_SAMPLES];

// // Calibration
// float pH_slope = -4.7605;
// float pH_intercept = 18.362;
float pH_slope = 1.203333;
float pH_intercept = 1.363331;

// Calibration
float pH_slopeX = -4.7605;
float pH_interceptX = 18.362;

// TDS sensor
#define VREF_TDS 5.0
#define SCOUNT 30
#define TDS_KEY "tdsCal"
float tdsCalibrationFactor = 1.0;
int analogBuffer[SCOUNT];
int analogBufferTemp[SCOUNT];
int analogBufferIndex = 0, copyIndex = 0;
float averageVoltage = 0, tdsValue = 0, temperature = 25;
float compensationCoefficient;
float compensationVoltage;

// Temperature sensor
OneWire oneWire(TempPin);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(115200); // Debugging
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2); // UART for LoRa communication

  sensors.begin();
  pinMode(TDSPin, INPUT);
  pinMode(PHPin, INPUT);
  pinMode(DOPin, INPUT);
  pinMode(orpPin, INPUT);
  pinMode(TurbPin, INPUT);

  Serial.print("Loaded Slope: ");
  Serial.println(pH_slope, 4);
  Serial.print("Loaded Intercept: ");
  Serial.println(pH_intercept, 4);

  gravityTDS.setPin(TDSPin);
  gravityTDS.setAref(VREF_TDS);
  gravityTDS.setAdcRange(4095);
  gravityTDS.begin();

  prefs.begin("TDS_KEY", true);
  float tdsCalibrationValue = prefs.getFloat("factor", 1.0);
  prefs.end();

  gravityTDS.setKvalueAddress(0x08);
  gravityTDS.update();

  Serial.print("Loaded TDS Calibration Factor: ");
  Serial.println(tdsCalibrationValue, 4);
}

void loop() {
  updateORP();
    
  switch(currentState) {
    case INITIAL_TEST:
      handleInitialTest();
      break;
    case NORMAL_OPERATION:
      handleNormalOperation();
      break;
  }
}

void handleInitialTest() {
  if(iterationCounter < INITIAL_SAMPLES) {
    float pH_val = readpH(analogRead(PHPin));
    float tds_val = readTDS(analogRead(TDSPin));
    sensors.requestTemperatures();
    float temp_val = sensors.getTempCByIndex(0);
    float dox_val = readDO((float)sensors.getTempCByIndex(0));
    float turb_val = readTurbidity();

    Serial.print("Initial Test ");
    Serial.print(iterationCounter + 1);
    Serial.print(" | pH: ");
    Serial.print(pH_val, 2);
    Serial.print(" | TDS: ");
    Serial.print(tds_val, 2);
    Serial.print(" | DO: ");
    Serial.print(dox_val, 2);
    Serial.print(" | Temp: ");
    Serial.print(temp_val, 2);
    Serial.print(" | ORP: ");
    Serial.print(orpValue, 2);
    Serial.print(" | Turb: ");
    Serial.println(turb_val, 2);

    iterationCounter++;
    delay(INITIAL_DELAY_MS);
  } else {
    Serial.println("\nInitial test complete. Starting pH calibration.\n");
    currentState = NORMAL_OPERATION;
    iterationCounter = 0;
  }
}

void handleNormalOperation() {
  if(iterationCounter < NORMAL_SAMPLES) {
    pH_samples[iterationCounter] = readpH(analogRead(PHPin));
    tds_samples[iterationCounter] = readTDS(analogRead(TDSPin));
    sensors.requestTemperatures();
    temp_samples[iterationCounter] = sensors.getTempCByIndex(0);
    dox_samples[iterationCounter] = readDO((float)sensors.getTempCByIndex(0));
    turb_samples[iterationCounter] = readTurbidity();

    Serial.print("Normal Iteration ");
    Serial.print(iterationCounter + 1);
    Serial.print(" | pH: ");
    Serial.print(pH_samples[iterationCounter], 2);
    Serial.print(" | TDS: ");
    Serial.print(tds_samples[iterationCounter], 2);
    Serial.print(" | DO: ");
    Serial.print(dox_samples[iterationCounter], 2);
    Serial.print(" | Temp: ");
    Serial.print(temp_samples[iterationCounter], 2);
    Serial.print(" | ORP: ");
    Serial.print(orpValue, 2);
    Serial.print(" | Turb: ");
    Serial.println(turb_samples[iterationCounter], 2);

    iterationCounter++;
    delay(SAMPLE_DELAY_MS);
  } else {
    float avg_pH = average(pH_samples, NORMAL_SAMPLES);
    float avg_tds = average(tds_samples, NORMAL_SAMPLES);
    float avg_do = (average(dox_samples, NORMAL_SAMPLES))/1000;
    float avg_temp = average(temp_samples, NORMAL_SAMPLES);
    float avg_turb = average(turb_samples, NORMAL_SAMPLES); 
    
    // Format data as CSV: {pH, TDS, DO, Temp, ORP, Turb}
    // String dataToSend = "I," + String(avg_pH) + "," + 
    //                     String(avg_tds) + "," + 
    //                     String(avg_do) + "," + 
    //                     String(avg_temp) + "," + 
    //                     String(orpValue) + "," + 
    //                     String(avg_turb);
    String dataToSend = "I," + String(avg_pH) + "," + 
                        String(avg_tds) + "," + 
                        String(avg_do) + "," + 
                        String(avg_temp) + "," + 
                        "null" + "," + 
                        "null";

    Serial2.println(dataToSend); // Send data via UART to TTGO LoRa32
    Serial.println("Sent to LoRa32: " + dataToSend); // Debugging

    delay(1000);

    Serial.println("\nUpload complete. Restarting normal cycle.\n");
    iterationCounter = 0;
  }
}

float readTurbidity() {
  return analogRead(TurbPin) * (5.0 / 4095.0);  // Convert to voltage
}

float readDO(float temp) {
  // Convert raw ADC value to voltage (ensure floating-point division)
  float voltage_mv = analogReadMilliVolts(DOPin);
  float V_saturation;

  if (TWO_POINT_CALIBRATION == 0) {
    // Single-point calibration (ensuring float division)
    V_saturation = static_cast<float>(CAL1_V) + 
                    35.0f * temp - 
                    static_cast<float>(CAL1_T) * 35.0f;
  } else {
    // Two-point calibration (ensuring float calculations)
    V_saturation = ((temp - static_cast<float>(CAL2_T)) * 
                    (static_cast<float>(CAL1_V) - static_cast<float>(CAL2_V)) /
                    (static_cast<float>(CAL1_T) - static_cast<float>(CAL2_T))) + 
                    static_cast<float>(CAL2_V);
  }

  // Calculate and return the dissolved oxygen concentration as a float
  return (voltage_mv * DO_Table[static_cast<int>(temp)] / V_saturation);
}

void updateORP() {
  static unsigned long orpTimer = millis();
  
  if(millis() >= orpTimer) {
    orpTimer += 20;
    orpArray[orpArrayIndex++] = analogRead(orpPin);
    if(orpArrayIndex >= ORP_ARRAY_LENGTH) {
      orpArrayIndex = 0;
      double avg = averagearray(orpArray, ORP_ARRAY_LENGTH);
      orpValue = ((30*VOLTAGE*1000) - (75*avg*VOLTAGE*1000/4095))/75 - OFFSET;
    }
  }
}

double averagearray(int* arr, int size) {
  if (size < 5) {
    long sum = 0;
    for (int i = 0; i < size; i++) sum += arr[i];
    return sum / size;
  }
  int minVal = arr[0], maxVal = arr[0];
  long sum = 0;
  for (int i = 0; i < size; i++) {
    if (arr[i] < minVal) minVal = arr[i];
    if (arr[i] > maxVal) maxVal = arr[i];
    sum += arr[i];
  }
  return (sum - minVal - maxVal) / (size - 2.0);
}

float readpH(int raw) {
  float voltage = raw * (3.3 / 4095.0);
  float pH_value = (pH_slopeX * voltage) + pH_interceptX;
  return pH_value;
}

float readTDS (int value){
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
                857.39 * compensationVoltage) * 0.5 * tdsCalibrationFactor;
  }

  return tdsValue;
}

// float readDO(uint32_t raw) {
//   return (raw * (VREF / 4095));  // Convert to mV
// }

float average(float* arr, int size) {
  float sum = 0;
  for (int i = 0; i < size; i++) sum += arr[i];
  return sum / size;
}

int getMedianNum(int bArray[], int iFilterLen) {
  int bTab[iFilterLen];
  for (byte i = 0; i < iFilterLen; i++)
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
  if ((iFilterLen & 1) > 0)
      bTemp = bTab[(iFilterLen - 1) / 2];
  else
      bTemp = (bTab[iFilterLen / 2] + bTab[iFilterLen / 2 - 1]) / 2;
  return bTemp;
}

