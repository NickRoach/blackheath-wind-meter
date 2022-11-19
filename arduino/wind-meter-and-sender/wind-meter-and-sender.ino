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
const char server[] = "210.84.29.215";
const char resource[] = "/";
const int  port = 81;
unsigned long timeout;

float speedTime;
float directionTime;
float speedValue;
float averageSpeed;
float directionValue;
float directionAngle;
float averageDirectionAngle = 0;
int speedCounter = 0;
int directionCounter = 0;
bool speedFlag;

long duration;
int distance;

#include <TinyGsmClient.h>
TinyGsm modem(SerialAT);
TinyGsmClient client(modem);
#define SIM_POWER 8
#define speedPin 2
#define directionPin 3

void setup() {
  pinMode(speedPin, INPUT_PULLUP);
  pinMode(directionPin, INPUT_PULLUP);

//  attachInterrupt(digitalPinToInterrupt(speedPin), updateSpeed, FALLING);
//  attachInterrupt(digitalPinToInterrupt(directionPin), updateDirection, FALLING);
  
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

//void updateSpeed(){
//  //if it has been more than 10 ms since the last trigger
//  if(millis() - speedTime > 10){
//    speedValue = millis() - speedTime;
//    speedTime = millis();
//    setSpeedFlag();
//  }
//}

//void updateDirection(){
//  if(millis() - directionTime > 10){
//    directionValue = millis() - directionTime;
//    doDirection();
//    directionTime = millis();
//  }
//}

//void setSpeedFlag(){
//  speedFlag = true;
//}

//void doDirection(){
//  if(speedFlag){
//    directionAngle = directionValue/speedValue*360;
//    SerialMon.print("directionAngle: ");
//    SerialMon.println(directionAngle);
////    SerialMon.print("speedValue: ");
////    SerialMon.println(speedValue);
////    SerialMon.print("directionAngle: ");
////    SerialMon.println(directionAngle);
//    averageDirectionAngle = ((averageDirectionAngle *  directionCounter) + directionAngle) / ++directionCounter;
////    SerialMon.print("directionCounter: ");
////    SerialMon.println(directionCounter);
//    SerialMon.print("averageDirectionAngle: ");
//    SerialMon.println(averageDirectionAngle);
//    speedFlag = false;
//  }
//}

//String makeString(){
//  String a = "{\"fullRotationTime\":";
//  a  = a + 1000;
//  a = a + ",\"averageDirectionAngle\":";
//  a = a + averageDirectionAngle;
//  a = a + "}";
//  return a;
//}

String makeHardcodedString(){
  String a = "{\"fullRotationTime\":";
  a  = a + 1000;
  a = a + ",\"averageDirectionAngle\":";
  a = a + 20;
  a = a + "}";
  return a;
}

void loop() {

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
  String httpRequestData = makeHardcodedString();
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
