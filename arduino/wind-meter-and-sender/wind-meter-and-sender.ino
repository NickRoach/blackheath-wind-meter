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

float windDirection;
float rawDirection;
float directionAngle;
double directionTime = millis();
double sendTime = millis();
double speedTime = millis();
int rpm;
long rph;
float speedValue;
float sector;
int sectorNumber;
int S0 = 0;
int S1 = 0;
int S2 = 0;
int S3 = 0;
int S4 = 0;
int S5 = 0;
int S6 = 0;
int S7 = 0;
int S8 = 0;
int S9 = 0;
int S10 = 0;
int S11 = 0;
int S12 = 0;
int S13 = 0;
int S14 = 0;
int S15 = 0;

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
  
//  pinMode(SIM_POWER, OUTPUT);
//  digitalWrite(SIM_POWER, HIGH);
//  delay(180);
//  digitalWrite(SIM_POWER, LOW);
//  delay(3000);
  speedTime = millis();
  SerialMon.begin(4800);
//  delay(10);
//  SerialMon.println("Wait...");
//  SerialAT.begin(57600);
//  delay(600);
//  SerialMon.println("Initializing modem...");
}

void updateSpeed(){
//  if it has been more than 10 ms since the last trigger
    if(millis() - speedTime > 10){
      speedValue = millis() - speedTime;
      speedTime = millis();
      
      SerialMon.print("RPM: ");
      rpm = 1/((speedValue/1000)/60);
      SerialMon.println(rpm);
//      SerialMon.print("RPH: ");
//      SerialMon.println(rpm * 60);
      
    }
}

void checkDirection(){
  rawDirection = analogRead(directionPin);
  sector = rawDirection + 32;
  if(sector > 1024){
    sector = sector - 1024;
    }
  sectorNumber = int(sector / 64);
  switch (sectorNumber){
    case 0:
      S0++;
      break;
    case 1: 
      S1++;
      break;
    case 2: 
      S2++;
      break;
    case 3: 
      S3++;
      break;
    case 4: 
      S4++;
      break;
    case 5: 
      S5++;
      break;
    case 6: 
      S6++;
      break;
    case 7: 
      S7++;
      break;
    case 8: 
      S8++;
      break;
    case 9: 
      S9++;
      break;
    case 10: 
      S10++;
      break;
    case 11: 
      S11++;
      break;
    case 12: 
      S12++;
      break;
    case 13: 
      S13++;
      break;
    case 14: 
      S14++;
      break;
    case 15: 
      S15++;
      break;
  }
  SerialMon.print("S0: ");
  SerialMon.println(S0);
}

void makeHardcodedString(){
  char buf[100];
  const char *first = "{\"RPMAverage\":";
  const char *second = toCharArray(15);
  strcpy(buf,first);
  strcat(buf,second);
//  a = a + ",\"RPMMinimum\":";
//  a = a + 5;
//  a = a + ",\"RPMMaximum\":";
//  a = a + 20;
//  a = a + ",\"S0\":";
//  a = a + S0;
//  a = a + ",\"S1\":";
//  a = a + S1;
//  a = a + ",\"S2\":";
//  a = a + S2;
//  a = a + ",\"S3\":";
//  a = a + S3;
//  a = a + ",\"S4\":";
//  a = a + S4;
//  a = a + ",\"S5\":";
//  a = a + S5;
//  a = a + ",\"S6\":";
//  a = a + S6;
//  a = a + ",\"S7\":";
//  a = a + S7;
//  a = a + ",\"S8\":";
//  a = a + S8;
//  a = a + ",\"S9\":";
//  a = a + S9;
////  a = a + ",\"S10\":";
////  a = a + S10;
//  a = a + ",\"S11\":";
//  a = a + S11;
//  a = a + ",\"S12\":";
//  a = a + S12;
//  a = a + ",\"S13\":";
//  a = a + S13;
//  a = a + ",\"S14\":";
//  a = a + S14;
//  a = a + ",\"S15\":";
//  a = a + S15;
//  a = a + "}";
  SerialMon.println(buf);
//  return a;
}

void sendData(){
//  modem.restart();
//  SerialMon.print("Waiting for network...");
//  if (!modem.waitForNetwork()) {
//    SerialMon.println(" fail");
//    delay(1000);
//    return;
//  }
//  SerialMon.println(" success");
//  if (modem.isNetworkConnected()) {
//    SerialMon.println("Network connected");
//  }
//
//  SerialMon.print(F("Connecting to "));
//  SerialMon.print(apn);
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
//  while(true){
//
//  if (!client.connect(server, port)) {
//    SerialMon.println(" fail");
//  }
//
//  SerialMon.println("Performing HTTP POST request...");
//  String httpRequestData = makeHardcodedString();
//  client.print(String("POST ") + resource + " HTTP/1.1\r\n");
//  client.print(String("Host: ") + server + "\r\n");
//  client.println("Connection: close");
//  client.println("Content-Type: application/json");
//  client.print("Content-Length: ");
//  client.println(httpRequestData.length());
//  client.println();
//  client.println(httpRequestData);
//  client.stop();
//  SerialMon.println("Done");
//  delay(10000);
//  }


//  
//  timeout = millis();
//  while (client.connected() && millis() - timeout < 5000) {
//    while (client.available()) {
//      char c = client.read();
//      SerialMon.print(c);
//      timeout = millis();
//    }
//  }
//
//  SerialMon.println();
//  client.stop();
//  SerialMon.println(F("Server disconnected"));
//  modem.gprsDisconnect();
//  SerialMon.println(F("GPRS disconnected"));
}

void loop() {
makeHardcodedString();
  
  if(millis() - directionTime > 10000) {
    checkDirection();
    directionTime = millis();
  }

  if(millis() - sendTime > 10000) {
    sendData();
    sendTime = millis();
  }
}
