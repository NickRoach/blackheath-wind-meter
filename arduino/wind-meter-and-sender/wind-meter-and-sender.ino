#define TINY_GSM_MODEM_SIM5360
#define SerialMon Serial
#include <SoftwareSerial.h>
SoftwareSerial SerialAT(4, 5); // RX, TX
#if !defined(TINY_GSM_RX_BUFFER)
#define TINY_GSM_RX_BUFFER 650
#endif
#define TINY_GSM_YIELD() { delay(2); }
const char apn[]  = "live.vodafone.com";
const char gprsUser[] = "";
const char gprsPass[] = "";
//const char server[] = "redirect-server2.herokuapp.com";
const char server[] = "123.243.73.161";
const char resource[] = "/";
const int  port = 80;
unsigned long timeout;

double directionTime = millis();
double sendTime = millis();
double speedTime = millis();
float windDirection;
float rawDirection;
float directionAngle;
long rpmSum;
bool minMeasured = false;
int rpmMeasurementCount;
int rpmMin;
int rpmMax;
float speedValue;
float sector;
int sectorNumber;
int sectorCounter[16];

#include <TinyGsmClient.h>
TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
#define SIM_POWER 8
#define speedPin 2
#define directionPin A0

void setup() {
   
  pinMode(speedPin, INPUT_PULLUP);
  pinMode(directionPin, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(speedPin), updateSpeed, FALLING);
  
  pinMode(SIM_POWER, OUTPUT);
  digitalWrite(SIM_POWER, HIGH);
  delay(180);
  digitalWrite(SIM_POWER, LOW);
  delay(3000);
  speedTime = millis();
  SerialMon.begin(4800);
  delay(10);
  SerialMon.println("Wait...");
  SerialAT.begin(57600);
  delay(600);
  SerialMon.println("Initializing modem...");
}

void updateSpeed(){
//  if it has been more than 10 ms since the last trigger
    if(millis() - speedTime > 10){
      speedValue = millis() - speedTime;
      speedTime = millis();
      
      int rpm = 1/((speedValue/1000)/60);
      rpmSum += rpm;
      rpmMeasurementCount++;
      if(rpm > rpmMax) {rpmMax = rpm;}
      if(rpm < rpmMin) {rpmMin = rpm;}

    SerialMon.print("rpmMeasurementCount");
    SerialMon.println(rpmMeasurementCount);
    SerialMon.print("rpmAverage");
    SerialMon.println(rpmSum / rpmMeasurementCount);
    SerialMon.print("rpmSum");
    SerialMon.println(rpmSum);
    SerialMon.print("rpmMax");
    SerialMon.println(rpmMax);
    SerialMon.print("rpmMin");
    SerialMon.println(rpmMin);
    }
}

int getRpmAverage() {
    int averageRpm = rpmSum / rpmMeasurementCount;
    rpmSum = 0;
    rpmMax = 0;
    rpmMin = 10000;
    return averageRpm;
}

void checkDirection(){
  rawDirection = analogRead(directionPin);
  sector = rawDirection + 32;
  if(sector > 1024){
    sector = sector - 1024;
    }
  sectorNumber = int(sector / 64);
  sectorCounter[sectorNumber]++;
}

String getJsonString(){
  String jsonString;

  jsonString += "{\"RPMMax\":";
  jsonString += rpmMax;
  jsonString += ",\"RPMMin\":";
  jsonString += rpmMin;
  jsonString += ",\"RPMAverage\":";
  jsonString += getRpmAverage();
  jsonString += ",\"sectorData\":";
  jsonString += "[";
  for(int i = 0; i <= 15; i++){
    jsonString += sectorCounter[i];
    if(i < 15){
        jsonString += ",";
      }
  }
  jsonString += "]";
  jsonString += "}";
  SerialMon.println(jsonString);
  return jsonString;
}

void sendData(){
  modem.restart();
  SerialMon.print("Waiting for network...");
  if (!modem.waitForNetwork()) {
    SerialMon.println(" fail");
    delay(1000);
    return;
  }
  SerialMon.println(" success");
  if (modem.isNetworkConnected()) {
    SerialMon.println("Network connected");
  }

  SerialMon.print(F("Connecting to "));
  SerialMon.print(apn);
  if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
    SerialMon.println(" fail");
    delay(1000);
    return;
  }
  SerialMon.println(" success");

  if (modem.isGprsConnected()) {
    SerialMon.println("GPRS connected");
  }

  while(true){

  if (!client.connect(server, port)) {
    SerialMon.println(" fail");
  }

  SerialMon.println("Performing HTTP POST request...");
  String httpRequestData = getJsonString();
  client.print(String("POST ") + resource + " HTTP/1.1\r\n");
  client.print(String("Host: ") + server + "\r\n");
  client.println("Connection: close");
  client.println("Content-Type: application/json");
  client.print("Content-Length: ");
  client.println(httpRequestData.length());
  client.println();
  client.println(httpRequestData);
  client.stop();
  SerialMon.println("Done");
  delay(10000);
  }


  
  timeout = millis();
  while (client.connected() && millis() - timeout < 5000) {
    while (client.available()) {
      char c = client.read();
      SerialMon.print(c);
      timeout = millis();
    }
  }

  SerialMon.println();
  client.stop();
  SerialMon.println(F("Server disconnected"));
  modem.gprsDisconnect();
  SerialMon.println(F("GPRS disconnected"));
}

void loop() {
  
  if(millis() - directionTime > 10000) {
    checkDirection();
    directionTime = millis();
  }

  if(millis() - sendTime > 10000) {
//    sendData();
    sendTime = millis();
  }
}
