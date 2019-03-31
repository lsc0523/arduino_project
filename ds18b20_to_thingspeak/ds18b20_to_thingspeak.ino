#include <OneWire.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <DallasTemperature.h>
#include <mylib.h>

#define ONE_WIRE_BUS D3

const char* host = "api.thingspeak.com";
String path = "/update?api_key=" + ApiKey + "&field1=";  

const char* host_aws = "54.180.121.174";
String path_aws = "/log?temperature=";  

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature DS18B20(&oneWire);

char temperatureString[6];

void setup(void){
  Serial.begin(115200);
  Serial.println("");
  
  WiFi.begin(ssid, pass);
 
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.print("Connected to ");
  Serial.println(ssid);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  DS18B20.begin();
   

}

float getTemperature() {
  float temp;
  do {
    DS18B20.requestTemperatures(); 
    temp = DS18B20.getTempCByIndex(0);
  } while (temp == 85.0 || temp == (-127.0));
  return temp;
}


void loop() {

  float temperature = getTemperature();
  
  dtostrf(temperature, 2, 2, temperatureString);
  // send temperature to the serial console
  Serial.println(temperatureString);

  WiFiClient client;  //thingspeak
  const int httpPort = 80;
  if (!client.connect(host, httpPort)) {
    Serial.println("connection failed1");
    return;
  }
  
  client.print(String("GET ") + path + temperatureString + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" + 
               "Connection: keep-alive\r\n\r\n");
  client.stop();

  //aws 서버로 올림
  const int httpPort_aws = 8080;
  if (!client.connect(host_aws, httpPort_aws)) {
    Serial.println("connection failed2");
    return;
  }
  client.print(String("GET ") + path_aws + temperatureString + 
               "&device=" + "ESP8266" +
               " HTTP/1.1\r\n" +
               "Host: " + host_aws + "\r\n" + 
               "Connection: keep-alive\r\n\r\n");
  client.stop();
  
  delay(59000);

}
