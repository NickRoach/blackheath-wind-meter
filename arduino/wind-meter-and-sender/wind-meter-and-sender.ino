#define TINY_GSM_MODEM_SIM5360
#define SerialMon Serial
#include <SoftwareSerial.h>
#include <TinyGsmClient.h>
#include <LowPower.h>
SoftwareSerial SerialAT(4, 5); // RX, TX
#if !defined(TINY_GSM_RX_BUFFER)
#define TINY_GSM_RX_BUFFER 650
#endif
#define TINY_GSM_YIELD() { delay(2); }
const char apn[]  = "live.vodafone.com";
const char gprsUser[] = "";
const char gprsPass[] = "";
const char server[] = "d2fuspthq8wz61.cloudfront.net";
const char resource[] = "/blackheath";
const int  port = 80;
unsigned long timeout;

double startTime = millis();
double pulse1 = -1;
double pulse2 = -1;
double waitTime = millis();
boolean timedOut = false;
int timeToWait = 2000;
int loopCount = 0;

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
float voltage;
float voltageSample;
int voltageSampleCount = 0;

TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
#define SIM_POWER 8
#define speedPin 2      // black
#define directionPin A0 // green
#define voltagePin A2   // black
                        // VCC: yellow
                        // GND: red (yes, red)

void setup() {
  pinMode(speedPin, INPUT_PULLUP);
  pinMode(directionPin, INPUT_PULLUP);
  pinMode(voltagePin, INPUT);
  pinMode(SIM_POWER, OUTPUT);
  SerialMon.begin(4800);
  delay(10);
  SerialMon.println();
  SerialMon.println("Starting...");
}


void loop() {
  attachInterrupt(digitalPinToInterrupt(speedPin), recordPulseTime, FALLING);
  startTime = millis();
  pulse1 = -1;
  pulse2 = -1;
  timedOut = false;

  Serial.print("loopCount: ");
  Serial.println(loopCount);

  // wait for pulse1
  while(timedOut == false && pulse1 == -1) {
    waitTime = millis();
    if(waitTime >= startTime + timeToWait) timedOut = true;
  }
  
  // wait for pulse2. If pulse1 timed out, don't bother
  startTime = millis();
  while(timedOut == false && pulse2 == -1) {
    waitTime = millis();
    if(waitTime >= startTime + timeToWait) timedOut = true;
  }

  // we don't need to listen to the anemometer anymore. Also, interrupts will wake it up from sleep
  detachInterrupt(digitalPinToInterrupt(speedPin));

  calculateAverageRpm();
  checkDirection();
  calculateAverageVoltage();

  ++loopCount;
  if(loopCount >= 40){
    sendData();
    loopCount = 0;
    voltageSampleCount = 0;
    resetMinMaxAv();
  }
  
  Serial.flush();
  LowPower.powerDown(SLEEP_4S, ADC_OFF, BOD_OFF); 
}


//////////////////////////////////////////////// Functions ////////////////////////////////////////////////

void recordPulseTime(){
  if(pulse1 == -1){
//    SerialMon.println("recording pulse 1");
      pulse1 = millis();
    }
  else if (pulse2 == -1 && millis() - pulse1 > 20){
//    SerialMon.println("recording pulse 2");
    pulse2 = millis();
  }
}

void calculateAverageRpm() {
// if anemometer isn't spinning, set rpm as 0
    if(timedOut == true) {
        rpm = 0;
      }
      else {
        rpm = 1/(((pulse2 - pulse1)/1000)/60);
      }

    if(rpm > rpmMax) rpmMax = rpm;
    if((rpm < rpmMin) || rpmMin == -1) rpmMin = rpm;
    
    rpmSum += rpm;
    rpmMeasurementCount++;
    
    rpmAv = rpmSum / rpmMeasurementCount;
    rpmTriggered = false;
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

void calculateAverageVoltage() {
  voltageSample = analogRead(voltagePin);
  voltageSample = voltageSample / 1024 * 5; 
  voltage = ((voltage * voltageSampleCount) + voltageSample) / ++voltageSampleCount;
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

void sendData(){
  if(voltage < 3.6) {
    SerialMon.println("low voltage");
    return;
  }
  digitalWrite(SIM_POWER, HIGH);
  delay(100);
  SerialMon.println("Sending data...");
  SerialAT.begin(57600);
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
  SerialMon.println(F("Server disconnected"));
  modem.gprsDisconnect();
  SerialMon.println(F("GPRS disconnected"));
  SerialMon.println();
  digitalWrite(SIM_POWER, LOW);
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
  };
  jsonString += "]";
  jsonString += ",\"voltage\":";
  jsonString += voltage;
  jsonString += "}";
  return jsonString;
}
