#define TINY_GSM_MODEM_SIM5360
#define SerialMon Serial
#include <SoftwareSerial.h>
#include <TinyGsmClient.h>
#include <LowPower.h>
#include <ThreeWire.h>  
#include <RtcDS1302.h>

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
double startTime;
double pulse1 = -1;
double pulse2 = -1;
double waitTime = millis();
boolean timedOut = false;
int timeToWait = 2000;
int minuteLastSent = -1;
int dateTimeLastUpdated = -1;
RtcDateTime rtcTime;
float windDirection;
float rawDirection;
float directionAngle;
long rpmSum;
int rpmMeasurementCount;
int rpm;
int rpmMin;
int rpmMax;
int rpmAv;
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
#define directionPin A1 // green
#define voltagePin A2   // black
                        // VCC: yellow
                        // GND: red (yes, red)
#define rtcVcc 10
#define rtcGnd 11
#define rtcClk 12
#define rtcDa  13
#define rtcRst A0

ThreeWire myWire(rtcDa,rtcClk,rtcRst); // IO, SCLK, CE
RtcDS1302<ThreeWire> Rtc(myWire);

void setup() {
  pinMode(speedPin, INPUT_PULLUP);
  pinMode(directionPin, INPUT_PULLUP);
  pinMode(voltagePin, INPUT);
  pinMode(SIM_POWER, OUTPUT);
  pinMode(rtcVcc, OUTPUT);
  pinMode(rtcGnd, OUTPUT);
  pinMode(rtcClk, OUTPUT);
  pinMode(rtcDa, OUTPUT);
  pinMode(rtcRst, OUTPUT);

  digitalWrite(rtcVcc, HIGH);
  digitalWrite(rtcGnd, LOW);

  SerialMon.begin(4800);
  delay(10);
  SerialMon.println("Starting...");

  Rtc.Begin();
  Rtc.SetIsWriteProtected(false);
  Rtc.SetIsRunning(true);
  Rtc.SetIsWriteProtected(true);
  rtcTime = Rtc.GetDateTime();
  minuteLastSent = rtcTime.Minute();
}


void loop() {
  attachInterrupt(digitalPinToInterrupt(speedPin), recordPulseTime, FALLING);
  pulse1 = -1;
  pulse2 = -1;
  timedOut = false;

  // this is necessary so that millis() works properly. I don't know why
  SerialMon.print("");
  
  startTime = millis();

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
  
  // we don't need to listen to the anemometer anymore. Also, interrupts would wake it up from sleep
  detachInterrupt(digitalPinToInterrupt(speedPin));

  calculateAverageRpm();
  checkDirection();
  calculateAverageVoltage();
  
  rtcTime = Rtc.GetDateTime();
    
  if(rtcTime.Minute() % 5 == 0 && rtcTime.Minute() != minuteLastSent){
    minuteLastSent = rtcTime.Minute();
    sendData();
    resetVariables();
  }
  
  Serial.flush();
  LowPower.powerDown(SLEEP_4S, ADC_OFF, BOD_OFF); 
}


//////////////////////////////////////////////// Functions ////////////////////////////////////////////////

void recordPulseTime(){
  if(pulse1 == -1){
      pulse1 = millis();
    }
  // 20ms time to alleviate switch noise. This limits the maximum measurable wind speed to about 100kt
  else if (pulse2 == -1 && millis() - pulse1 > 20){
    pulse2 = millis();
  }
}

void calculateAverageRpm() {
// if anemometer isn't spinning, set rpm as 0
  if(timedOut == true) {
      rpm = 0;
    // SerialMon.println("timed out");
    }
    else {
      rpm = 1/(((pulse2 - pulse1)/1000)/60);
    // SerialMon.println("rpm set");
    }
  if(rpm > rpmMax) rpmMax = rpm;
  if((rpm < rpmMin) || rpmMin == -1) rpmMin = rpm;
  rpmSum += rpm;
  rpmMeasurementCount++;
  rpmAv = rpmSum / rpmMeasurementCount;
}

void sendData(){
  if(voltage < 3.6) return;
  SerialMon.println("Sending data...");
  digitalWrite(SIM_POWER, HIGH);
  delay(100);
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

  // just after midnight each day, update the RTC with network time
  if(rtcTime.Day() != dateTimeLastUpdated){
  SerialMon.print("Setting time with network time... ");
  int   year     = 0;
  int   month    = 0;
  int   day      = 0;
  int   hour     = 0;
  int   minute   = 0;
  int   second   = 0;
  float timezone = 0;
  if (modem.getNetworkTime(&year, &month, &day, &hour, &minute, &second, &timezone)) {
    RtcDateTime gsmTime = RtcDateTime(year, month, day, hour, minute, second);
    Rtc.SetIsWriteProtected(false);
    Rtc.SetDateTime(gsmTime);
    Rtc.SetIsWriteProtected(true);
    dateTimeLastUpdated = gsmTime.Day();
    SerialMon.println("done");
    } else {
      SerialMon.println("couldn't get network time, retrying next send cycle");
    }
  }



  SerialMon.print(F("Connecting to "));
  SerialMon.print(apn);
  SerialMon.print("...");
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

  SerialMon.println("Performing HTTP POST...");
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
  digitalWrite(SIM_POWER, LOW);
  SerialMon.println();
  SerialMon.println("Recording wind data...");
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



void resetVariables(){
  rpmMin = -1;
  rpmMax = 0;
  rpmSum = 0;
  rpmMeasurementCount = 0;
  for(int i = 0; i <= 15; i++){
    sectorCounter[i] = 0;
  }
  voltageSampleCount = 0;
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
