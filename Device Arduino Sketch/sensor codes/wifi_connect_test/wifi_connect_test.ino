#include <WiFi.h>
#include "time.h"

const char* ssid = "ZTE_2.4G_QQzXW7";
const char* password = "yeWMp5gS";

const char* ntpServer = "pool.ntp.org";
const char* ntpServer2 = "time.nist.gov";

void setup()
{
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
      delay(500);
  }

  Serial.println("Wifi Connected");
  configTime(28800, 0, ntpServer, ntpServer2);
}

void loop () 
{
  delay(1000);
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("error");
  }

  else
  {
    Serial.println(&timeinfo, "%A, %B %d %Y %H:%M:%S");
  }
  
}