#define TINY_GSM_MODEM_SIM5360
#define SerialMon Serial
#include <SoftwareSerial.h>
#include <TinyGsmClient.h>
SoftwareSerial SerialAT(4, 5); // RX, TX
#if !defined(TINY_GSM_RX_BUFFER)
#define TINY_GSM_RX_BUFFER 650
#endif
#define TINY_GSM_YIELD() { delay(2); }
const char apn[]  = "live.vodafone.com";
const char gprsUser[] = "";
const char gprsPass[] = "";
const char server[] = "redirect-server2.herokuapp.com";
//const char server[] = "123.243.73.161";
const char resource[] = "/";
const int  port = 80;
unsigned long timeout;

double directionPeriodTimer = millis();
double sendPeriodTimer = millis();
double rotationTriggerMoment = millis();
double rpmPeriodTimer = millis();
float windDirection;
float rawDirection;
float directionAngle;
bool rpmTriggered = false;
long rpmSum;
int rpmMeasurementCount;
int rpm;
int rpmMin;
int rpmMax;
int rpmAv;
float rotationInterval;
float sector;
int sectorNumber;
int sectorCounter[16];

TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
#define SIM_POWER 8
#define speedPin 2 // black
#define directionPin A0 // green
// VCC: yellow
// GND: red (yes, red)

void setup() {
   
  pinMode(speedPin, INPUT_PULLUP);
  pinMode(directionPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(speedPin), updateRpm, FALLING);
  
  pinMode(SIM_POWER, OUTPUT);
  digitalWrite(SIM_POWER, HIGH);
  delay(180);
  digitalWrite(SIM_POWER, LOW);
  delay(3000);
  SerialMon.begin(4800);
  delay(10);
  SerialMon.println("Wait...");
  SerialAT.begin(57600);
  delay(600);
  SerialMon.println("Initializing modem...");
}

void updateRpm(){
    //  if it has been more than 20 ms since the last trigger. Prevents double triggering. This limits the measurement speed to 100kt
    if(millis() - rotationTriggerMoment > 20){
      rotationInterval = millis() - rotationTriggerMoment;
      rotationTriggerMoment = millis();
      rpm = 1/((rotationInterval/1000)/60);
      rpmTriggered = true;
    }
}

void calculateAverageRpm() {
    // if anemometer isn't spinning, set rpm as 0
    if(rpmTriggered == false) {rpm = 0;}

    if(rpm > rpmMax) rpmMax = rpm;
    if((rpm < rpmMin) || rpmMin == -1) rpmMin = rpm;
    
    rpmSum += rpm;
    rpmMeasurementCount++;
    
    rpmAv = rpmSum / rpmMeasurementCount;
    rpmTriggered = false;
}

void resetMinMaxAv(){
  rpmMin = -1;
  rpmMax = 0;
  rpmSum = 0;
  rpmMeasurementCount = 0;
  for(int i = 0; i <= 15; i++){
    sectorCounter[i] = 0;
  }
}

void checkDirection(){
  // if the air isn't moving, direction is meaningless
  if(rpm == 0) return;
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
  jsonString += rpmAv;
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
  return jsonString;
}

void sendData(){
  modem.restart();
  // SerialMon.print("Waiting for network...");
  if (!modem.waitForNetwork()) {
    // SerialMon.println(" fail");
    delay(1000);
    return;
  }
  // SerialMon.println(" success");
  if (modem.isNetworkConnected()) {
    // SerialMon.println("Network connected");
  }

  // SerialMon.print(F("Connecting to "));
  // SerialMon.print(apn);
  if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
    // SerialMon.println(" fail");
    delay(1000);
    return;
  }
  // SerialMon.println(" success");

  if (modem.isGprsConnected()) {
    // SerialMon.println("GPRS connected");
  }

  if (!client.connect(server, port)) {
    // SerialMon.println(" fail");
  }

  // SerialMon.println("Performing HTTP POST request...");
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
  // SerialMon.println("Done");
  resetMinMaxAv();
  
  
  timeout = millis();
  while (client.connected() && millis() - timeout < 5000) {
    while (client.available()) {
      char c = client.read();
      // SerialMon.print(c);
      timeout = millis();
    }
  }

  // SerialMon.println();
  client.stop();
  // SerialMon.println(F("Server disconnected"));
  modem.gprsDisconnect();
  // SerialMon.println(F("GPRS disconnected"));
}

void loop() {
  // every 5 seconds, read the rpm and set average, min and max
  if(millis() - rpmPeriodTimer > 5000) {
    rpmPeriodTimer = millis();
    // SerialMon.println("Updating min max and average");
    calculateAverageRpm();
    checkDirection();
  }
  
  // every second, check direction
  if(millis() - directionPeriodTimer > 1000) {
    directionPeriodTimer = millis();
    // SerialMon.println("Updating direction");
    checkDirection();
  }

  // every 5 minutes, send the data
  if(millis() - sendPeriodTimer > 60000 * 5) {
    sendPeriodTimer = millis();
    sendData();
  }
}
