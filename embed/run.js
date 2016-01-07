// Create a new instance of node-core-audio 
var coreAudio = require("node-core-audio");
var http = require("http");
var request = require('request');
// Create a new audio engine 
var engine = coreAudio.createNewAudioEngine();
var macAddress;
var db;

var fs = require('fs');
var path = require('path');
var trimValue = null;
var lengthToAverage = 100;
var samples = [];
var errorThreshold = 10;
var warningThreshold = errorThreshold - 10;
var currentState = "green" //,yellow,red
var gpios = {
  "green": 1,
  "yellow": 2,
  "red": 3
}



function sendDataToServer(db,timestamp,deviceId) {
  console.log("This is the data we're going to try and send to the server:");
  console.log("DB: " + db);
  console.log("Timestamp: " + timestamp);
  console.log("deviceId: " + deviceId);
  
  request({
    uri: 'https://dropmic.herokuapp.com/recordings',
    method: 'POST',
    json: {dbValue: db, recordedAt: timestamp, mac: deviceId }
  },
  function (error, response, body) {
    if(response && response.statusCode == 200){
      console.log('data saved')
    } else {
      if(response.statusCode) {
          console.log('error: '+ response.statusCode)
      } else {
        console.log(response)
      }

      console.log("There was some sort of error connecting to the server. Let's try again in 10 seconds.")
      setTimeout(function(){ 
        sendDataToServer(db,timestamp,deviceId)
      },10000)
    }
  })
}

function sendNotificationToServer(theState,timestamp,deviceId) {
  console.log("This is the data we're going to try and send to the server:");
  console.log("STATE: " + theState);
  console.log("Timestamp: " + timestamp);
  console.log("deviceId: " + deviceId);
  
  request({
    uri: 'https://dropmic.herokuapp.com/notifications',
    method: 'POST',
    json: {
      notificationValue: theState,
      notificationSubject: "Device state change",
      notificationMessage: "Device " + deviceId + "has changed state to: " + theState,
      recordedAt: timestamp,
      mac: deviceId
    }
  },
  function (error, response, body) {
    if(response && response.statusCode == 200){
      console.log('data saved')
    } else {
      if(response.statusCode) {
          console.log('error: '+ response.statusCode)
      } else {
        console.log(response)
      }

      console.log("There was some sort of error connecting to the server. Let's try again in 10 seconds.")
      setTimeout(function(){ 
        sendDataToServer(db,timestamp,deviceId)
      },10000)
    }
  })
}

function changeGPIOToState( theState ) {
  var gpio = gpios[theState];
}

// Add an audio processing callback 
// This function accepts an input buffer coming from the sound card, 
// and returns an ourput buffer to be sent to your speakers. 
// 
// Note: This function must return an output buffer 
function processAudio( inputBuffer ) {
  var input = inputBuffer[0]
  , len = input.length
  , total = i = 0
  , rms
  , trim
  , dBFS
  
  
  for ( var j = 0; j < len; j = j + 2) {
    var sample = input[j]; // 32768.0
    total += (sample * sample);
  }
  
  rms = Math.sqrt(total / (len / 2));
  dBFS = 20 * Math.log10(rms);
  trim = trimValue; // 7.65 //From calibrate.js
  calibratedDBFS = dBFS + trim;
  givenDb = 94.0 //The value the calibration device sends
  
  db = dBFS + trim + givenDb //need to convert dbfs to db
  
  samples.push(db);
  
  console.log(samples.length)
  
  if(samples.length > lengthToAverage) {
    console.log("OK. We're in business")
    samples.shift();
    
    var sum = 0;
    for( var i = 0; i < samples.length; i++ ){
        sum += parseInt( samples[i], 10 ); //don't forget to add the base
    }

    var avg = sum/samples.length;
    var lastState = currentState;
    
    if(avg > errorThreshold) {
      currentState = "red"
    } else if(avg > warningThreshold) {
      currentState = "yellow"
    } else {
      currentState = "green"
    }
    
    
    
    if(lastState != currentState) {
      sendNotificationToServer(currentState,(new Date()),macAddress);
    }
    
  }
  
  // console.log("dBFS: " + dBFS);
  // console.log("calibratedDBFS: " + calibratedDBFS)
  // console.log("DB: " + db)

  return inputBuffer;
}

function main() {
  fs.readFile(path.join(__dirname, 'trim-value.txt'), {encoding: 'utf-8'}, function(err,data){
    if (!err) {
      console.log(data);
      trimValue = parseFloat(data);
    
      if(!trimValue) {
        console.log("DIEEEEEEEE");
      } else {
        
        setInterval(function() { //every second, send the data to the server
          if(db && isFinite(db)) {
            sendDataToServer(db,(new Date()),macAddress);
          }
        }, 1000)
        
        console.log(trimValue);
        require('getmac').getMac(function(err,ma){
        	console.log(macAddress);
          macAddress = ma;
          engine.addAudioCallback( processAudio );
        });
      }
    } else{
      console.log(err);
    }

  });
}



for(var i=0; i<engine.getNumDevices(); i++) {
  console.log(engine.getDeviceName(i));
}


engine.setOptions({
  inputChannels: 1,
  inputDevice: 0, //5, ///THIS VALUE WILL HAVE TO BE CHANGED TO MATCH THE APPROPRIATE INPUT DEVICE
  outputChannels: 1
});


// console.log(engine.read())



main();







// console.log(engine.getDeviceName(0));
// console.log(engine.getDeviceName(1));
// console.log(engine.getDeviceName(2));
// console.log(engine.getDeviceName(3));