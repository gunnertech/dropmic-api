// Create a new instance of node-core-audio 
var coreAudio = require("node-core-audio");
var http = require("http");
var request = require('request');
// Create a new audio engine 
var engine = coreAudio.createNewAudioEngine();
var macAddress;
var db;

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
  , deviceId = "pooptide"
  
  for ( var j = 0; j < len; j = j + 2) {
    var sample = input[j] // 32768.0
    total += (sample * sample);
  }
  
  rms = Math.sqrt(total / (len / 2));
  dBFS = 20 * Math.log10(rms);
  trim = 7.65 //From calibrate.js
  calibratedDBFS = dBFS + trim;
  givenDb = 94.0 //The value the calibration device sends
  
  db = dBFS + trim + givenDb //need to convert dbfs to db
  
  
  
  
  // console.log("dBFS: " + dBFS);
  // console.log("calibratedDBFS: " + calibratedDBFS)
  // console.log("DB: " + db)
  
  
  
  
  

  return inputBuffer;
}

setInterval(function() { //every second, send the data to the server
  if(db && isFinite(db)) {
    sendDataToServer(db,(new Date()),macAddress);
  }
}, 1000)

engine.setOptions({
  inputChannels: 1,
  inputDevice: 0,
  outputChannels: 1
});

// console.log(engine.read())

require('getmac').getMac(function(err,ma){
	console.log(macAddress);
  macAddress = ma;
  engine.addAudioCallback( processAudio );
});


console.log(engine.getNumDevices());

// console.log(engine.getDeviceName(0));
// console.log(engine.getDeviceName(1));
// console.log(engine.getDeviceName(2));
// console.log(engine.getDeviceName(3));