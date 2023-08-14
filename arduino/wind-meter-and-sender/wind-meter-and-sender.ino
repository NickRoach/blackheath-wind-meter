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
const char password[] = "";
const int  port = 80;
unsigned long timeout;
unsigned long startTime;
unsigned long pulse1 = -1;
unsigned long pulse2 = -1;
unsigned long pulseDelay;
unsigned long waitTime = millis();
boolean timedOut = false;
int timeToWait = 2000;
int minuteLastSent = -1;
int dateTimeLastUpdated = -1;
RtcDateTime rtcTime;
int rawDirection;
float voltage;
float voltageSample;
int voltageSampleCount = 0;
String jsonString;

TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
#define SIM_POWER 8
#define CHARGE_OFF 9
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
  pinMode(CHARGE_OFF, OUTPUT);
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
  resetVariables();
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

  checkDirection();
  calculateAverageVoltage();
  pulseDelay = pulse2 - pulse1;

  if(timedOut == true) {
    jsonString += "x,y,";
  } else {
    jsonString += rawDirection;
    jsonString += ",";
    jsonString += pulseDelay;
    jsonString += ",";
  }
  
  rtcTime = Rtc.GetDateTime();
    
  if(rtcTime.Minute() % 1 == 0 && rtcTime.Minute() != minuteLastSent){
    minuteLastSent = rtcTime.Minute();
//    sendData();
    resetVariables();
  }
  
  Serial.flush();
//  LowPower.powerDown(SLEEP_8S, ADC_OFF, BOD_OFF); 
}


//////////////////////////////////////////////// Functions ////////////////////////////////////////////////

void recordPulseTime(){
  if(pulse1 == -1){
      pulse1 = micros();
    }
  // 20ms time to alleviate switch noise. This limits the maximum measurable wind speed to about 100kt
  else if (pulse2 == -1 && micros() - pulse1 > 200000){
    pulse2 = micros();
  }
}



void sendData(){
  jsonString.remove(jsonString.length() - 1, 1);
  jsonString += "]";
  SerialMon.print("jsonString: ");
  SerialMon.println(jsonString);

  
//  if(voltage < 3.7) return;
//  SerialMon.println("Sending data...");
//  digitalWrite(SIM_POWER, HIGH);
//  delay(100);
//  SerialAT.begin(57600);
//  modem.restart();
//
//  SerialMon.print("Waiting for network...");
//  if (!modem.waitForNetwork()) {
//     SerialMon.println(" fail");
//    delay(1000);
//    return;
//  }
//  SerialMon.println(" success");
//  if (modem.isNetworkConnected()) {
//     SerialMon.println("Network connected");
//  }
//
//  // at 3am each day, update the RTC with network time
//  if((rtcTime.Day() != dateTimeLastUpdated && rtcTime.Hour() == 3) || rtcTime.Year() == 2080){
//  SerialMon.print("Setting time with network time... ");
//  int   year     = 0;
//  int   month    = 0;
//  int   day      = 0;
//  int   hour     = 0;
//  int   minute   = 0;
//  int   second   = 0;
//  float timezone = 0;
//  if (modem.getNetworkTime(&year, &month, &day, &hour, &minute, &second, &timezone)) {
//    if(year != 2080){
//      RtcDateTime gsmTime = RtcDateTime(year, month, day, hour, minute, second);
//      Rtc.SetIsWriteProtected(false);
//      Rtc.SetDateTime(gsmTime);
//      Rtc.SetIsWriteProtected(true);
//      dateTimeLastUpdated = gsmTime.Day();
//      SerialMon.println("done");
//      }
//    } else {
//      SerialMon.println("couldn't get network time, retrying next send cycle");
//    }
//  }
//  
//  SerialMon.print(F("Connecting to "));
//  SerialMon.print(apn);
//  SerialMon.print("...");
//  if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
//    SerialMon.println(" fail");
//    delay(1000);
//    return;
//  }
//  SerialMon.println(" success");
//
//  if (modem.isGprsConnected()) {
//    SerialMon.println("GPRS connected");
//  }
//
//  if (!client.connect(server, port)) {
//    SerialMon.println(" fail");
//  }
//
//  SerialMon.println("Performing HTTP POST...");
//  String httpRequestData = getJsonString(rtcTime);
//  client.print(String("POST ") + resource + " HTTP/1.1\r\n");
//  client.print(String("Host: ") + server + "\r\n");
//  client.println("Connection: close");
//  client.println("Content-Type: application/json");
//  client.print("password: ");
//  client.println(password);
//  client.print("Content-Length: ");
//  client.println(httpRequestData.length());
//  client.println();
//  client.println(httpRequestData);
//  client.stop();
//  SerialMon.println("Done");
//  digitalWrite(SIM_POWER, LOW);
//  SerialMon.println();
//  SerialMon.println("Recording wind data...");
}



void checkDirection(){
  rawDirection = analogRead(directionPin);
}



void calculateAverageVoltage() {
  voltageSample = analogRead(voltagePin);
  voltageSample = voltageSample / 1024 * 5; 
  voltage = ((voltage * voltageSampleCount) + voltageSample) / ++voltageSampleCount;
  // preserve battery by not charging all the way to 4.2 V
  if(voltage > 4.10) digitalWrite(CHARGE_OFF, LOW);
  if(voltage < 4.05) digitalWrite(CHARGE_OFF, HIGH);
}



void resetVariables(){
  jsonString = "{data:[";
  voltageSampleCount = 0;
}
