#include "FastLED.h"

////////////////////////////////////////////////////////////////////////////////////////////////////
//
// RGB Calibration code
//
// Use this sketch to determine what the RGB ordering for your chipset should be.  Steps for setting up to use:

// * Uncomment the line in setup that corresponds to the LED chipset that you are using.  (Note that they
//   all explicitly specify the RGB order as RGB)
// * Define DATA_PIN to the pin that data is connected to.
// * (Optional) if using software SPI for chipsets that are SPI based, define CLOCK_PIN to the clock pin
// * Compile/upload/run the sketch

// You should see six leds on.  If the RGB ordering is correct, you should see 1 red led, 2 green
// leds, and 3 blue leds.  If you see different colors, the count of each color tells you what the
// position for that color in the rgb orering should be.  So, for example, if you see 1 Blue, and 2
// Red, and 3 Green leds then the rgb ordering should be BRG (Blue, Red, Green).

// You can then test this ordering by setting the RGB ordering in the addLeds line below to the new ordering
// and it should come out correctly, 1 red, 2 green, and 3 blue.
//
//////////////////////////////////////////////////
#define NUM_LEDS 530
// Data pin that led data will be written out over
#define DATA_PIN 6
// Clock pin only needed for SPI based chipsets when not using hardware SPI
//#define CLOCK_PIN 8
int randNumber;
int mode = 0;

boolean isSold[530];
String flatId[530];

int numberOfLeds = 0;

boolean firstData = true;
boolean dataReceiveInProgress = false;
boolean initMode = false;
boolean waitingForData = false;
boolean waitingForLedCount = false;
int dataCount = 0;
int receivedLedId = 0;
int receivedData = 0;
int latestledIndex = 0;
String receivedDataStr = "";
//boolean flatlist[100];
//String onSaleList[198];

CRGB leds[NUM_LEDS];

void setup()
{
  randomSeed(analogRead(0));
  Serial.begin(115200);
  // sanity check delay - allows reprogramming if accidently blowing power w/leds
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
}

void loop()
{
  if (Serial.available() > 0)
  {
    int data_received = Serial.read();
    //Serial.print("I received: ");
    //Serial.println(data_received, DEC);
    if (initMode)
    {

      if (waitingForLedCount)
      {
        if (data_received == 46)
        {
          //NOKTA GELME DURUMU
          numberOfLeds = receivedData;
          waitingForLedCount = false;
          waitingForData = true;
          receivedData = 0;
          initArduinoStart();
          Serial.println(latestledIndex);
        }
        else
        {
          //NUMARA GELME DURUMU
          receivedData = (receivedData * 10) + (data_received - 48);
        }
      }
      else if (waitingForData)
      {
        if (data_received == 46)
        {
          //NOKTA GELME DURUMU
          isSold[latestledIndex] = receivedData;
          latestledIndex++;
          if (latestledIndex == numberOfLeds)
          {
            waitingForData = false;
            initMode = false;
            receivedData = 0;
            Serial.println("INIT_OK");
            initArduinoFinish();
          }
          else
          {
            Serial.println(latestledIndex);
          }
        }
        else
        {
          //NUMARA GELME DURUMU
          receivedData = data_received - 48;
        }
      }
      //------------------------------------------------
    }
    else
    {
      if (dataReceiveInProgress == false && data_received != 46)
      {
        if (data_received == 49)
        {
          //LED ON
          Serial.println("LEDON");
          mode = 1;
          dataReceiveInProgress = true;
        }
        else if (data_received == 50)
        {
          //LED OFF
          Serial.println("LEDOFF");
          mode = 2;
          dataReceiveInProgress = true;
        }
        else if (data_received == 51)
        {
          //SELL
          Serial.println("SOLD");
          mode = 3;
          dataReceiveInProgress = true;
        }
        else if (data_received == 52)
        {
          //ONSALE
          Serial.println("ONSALE");
          mode = 4;
          dataReceiveInProgress = true;
        }
        else if (data_received == 48)
        {
          //EFFECT
          Serial.println("EFFECT");
          mode = 0;
          dataReceiveInProgress = true;
        }
        else if (data_received == 53)
        {
          //SHOW ONSALE
          setShowOnSale();
          Serial.println("SHOW-ONSALE");
          mode = 5;
          dataReceiveInProgress = true;
        }
        else if (data_received == 54)
        {
          //ALLON
          Serial.println("ALLON");
          mode = 6;
          dataReceiveInProgress = true;
        }
        else if (data_received == 55)
        {
          //ALLOFF
          Serial.println("ALLOFF");
          mode = 7;
          dataReceiveInProgress = true;
        }
        else if (data_received == 56)
        {
          initArduinoStart();
          //dataReceiveInProgress=true;
        }
        else if (data_received == 57)
        {
          initArduinoFinish();
        }
        else if (data_received == 73)
        {
          //I : Init request
          initMode = true;
          Serial.println("sendLedCount");
          waitingForLedCount = true;
        }
      }
      else if (dataReceiveInProgress == true && data_received == 46)
      {
        //Data reception is finished.Nokta gelme durumu
        Serial.println("OK");
        dataReceiveInProgress = false;
        FastLED.show();
      }
      else if (dataReceiveInProgress == true && data_received != 46 && data_received != 44)
      {
        //Combine Data.Data gelirken
        if (firstData)
        {
          dataCount++;
          firstData = false;
        }
        //Serial.println("DATA COMBINATION");
        receivedLedId = receivedLedId * 10 + data_received - 48;
      }
      else if (dataReceiveInProgress == true && data_received == 44)
      {
        //Data seperator arrived.Virgul geldi.
        firstData = true;
        //Serial.println("DATA ARRIVED");
        if (mode == 1)
        {
          //On
          //Serial.println("FLAT ON");
          leds[receivedLedId] = CRGB(182, 95, 13);
        }
        else if (mode == 2)
        {
          //Off
          //Serial.println("FLAT OFF");
          leds[receivedLedId] = CRGB(0, 0, 0);
        }
        else if (mode == 3)
        {
          //Sell
          //Serial.println("FLAT SOLD");
          leds[receivedLedId] = CRGB(255, 1, 1);
          isSold[receivedLedId] = 1;
        }
        else if (mode == 4)
        {
          //OnSale
          //Serial.println("FLAT ONSALE");
          leds[receivedLedId] = CRGB(10, 255, 10);
          isSold[receivedLedId] = 0;
        }
        else if (mode == 5)
        {
          //Show OnSale
          if (dataCount != 0)
          {
            leds[receivedLedId] = CRGB(255, 1, 1);
          }
        }
        else if (mode == 6)
        {
          //All On
          showAllOn();
        }
        else if (mode == 7)
        {
          //All Off
          showAllOff();
        }
        else if (mode == 0)
        {
          //Effect
          showEffect();
        }

        receivedLedId = 0;
      }
    }
  }
}
void showEffect()
{
  for (int j = 0; j < NUM_LEDS; j++)
  {
    randNumber = random(2);
    if (randNumber == 0)
    {
      leds[j] = CRGB(182, 95, 13);
    }
    else
    {
      leds[j] = CRGB(0, 0, 0);
    }
  }
}

void showAllOff()
{
  for (int j = 0; j < NUM_LEDS; j++)
  {
    leds[j] = CRGB(0, 0, 0);
  }
}

void showAllOn()
{
  for (int j = 0; j < NUM_LEDS; j++)
  {
    leds[j] = CRGB(182, 95, 13);
  }
}

void setShowOnSale()
{
  for (int j = 0; j < numberOfLeds; j++)
  {
    if (isSold[j] == 1)
    {
      leds[j] = CRGB(255, 1, 1);
    }
    else
    {
      leds[j] = CRGB(1, 255, 1);
    }
  }
}

void initArduinoStart()
{
  for (int j = 0; j < NUM_LEDS; j++)
  {
    leds[j] = CRGB(182, 95, 13);
  }
  FastLED.show();
  Serial.println("ARDUINO_INIT_STARTED");
  //delay(3000);
}

void initArduinoFinish()
{
  for (int j = 0; j < NUM_LEDS; j++)
  {
    leds[j] = CRGB(0, 0, 0);
  }
  FastLED.show();
  Serial.println("ARDUINO_INIT_FINISHED");
}

void startup(int Red, int Green, int Blue)
{
  for (int j = 0; j < NUM_LEDS; j++)
  {
    leds[j] = CRGB(Red, Green, Blue);
  }
  FastLED.show();
}
