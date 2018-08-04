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

#define NUM_LEDS 60
// Data pin that led data will be written out over
#define DATA_PIN 6
// Clock pin only needed for SPI based chipsets when not using hardware SPI
//#define CLOCK_PIN 8
String dataString="";
int randNumber;

CRGB leds[NUM_LEDS];

void setup() {
    randomSeed(analogRead(0));
    Serial.begin(115200);
	  // sanity check delay - allows reprogramming if accidently blowing power w/leds
    FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
    
}

void loop() {
  if (Serial.available() > 0) {
    int data_received = Serial.read();
    ///Serial.print("I received: ");
    //Serial.println(data_rec_array,DEC);
    ///Serial.println(data_received,DEC);
    dataString+= data_received-48;
    if(data_received==49)
    {
      startup(255,0,0);
    }else if(data_received==50){
      startup(0,255,0);
      }else if(data_received==51){
        startup(0,0,255);
        }else if(data_received==52){
          startup(125,125,125);
          }else if(data_received==53){
            startup(255,255,255);
            }else if(data_received==54){
              startup(0,0,0);
            }else if(data_received==56){
              initArduino();
              }
  }
  if(dataString.length()!=0){
  Serial.println(dataString);
  dataString="";
  }
 }
void showEffect(){
   for(int j=0;j<NUM_LEDS;j++){
        randNumber = random(2);
        if(randNumber==0){
          leds[j]=CRGB(182, 95, 13);
        }else{
          leds[j]=CRGB(0, 0, 0);
        }
      }
      FastLED.show();
  }

 void initArduino(){
   for(int j=0;j<60;j++){
        leds[j]=CRGB(182,95,13);
      }
      FastLED.show();
     delay(3000);
      for(int j=0;j<60;j++){
        leds[j]=CRGB(0,0,0);
      }
      FastLED.show();
  }
  
void startup(int Red,int Green,int Blue){
    for(int j=0;j<60;j++){
        leds[j]=CRGB(Red,Green,Blue);
      }
      FastLED.show();
  }
