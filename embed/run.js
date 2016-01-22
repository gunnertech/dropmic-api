var coreAudio = require("node-core-audio");
var http = require("http");
var request = require('request');
var gpio = require("gpio");
var SerialPort = require("serialport").SerialPort;
var fs = require('fs');
var path = require('path');


var serialPort = new SerialPort("/dev/tty.usbmodem1411", {
  baudrate: 9600
},false);
var serialPortConnected = false;
var connectingInterval = null;

var engine = coreAudio.createNewAudioEngine();
var macAddress;
var db;

var trimValue = null;
var lengthToAverage = 10000; //TODO: What should this value be?
var samples = [];
var errorThreshold = null; //READ THIS FROM A FILE
var warningThreshold = errorThreshold - 10;
var currentDeviceState = "" //,yellow,red
var currentLevelState = "" //,yellow,red
var stateToGpio = {
  "connecting": 1,
  "connected": 1,
  "lostPower": 1,
  "warning": 2,
  "violation": 3
}


// serialPort.on("open", function () {
//   serialPort.on('data', function(data) {
//     console.log('data received: ' + data + ' huh?');
//   });
// });

///// DEVICE STATE CHANGES

function changeDeviceFromConnecting() {
  serialPort.write("gpio clear 0\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      clearInterval(connectingInterval);
    }
  });
}

function changeDeviceToConnecting() {
  if(currentDeviceState == "connecting"){ return; }
  
  if(global["changeDeviceFrom" + currentDeviceState]) {
    global["changeDeviceFrom" + currentDeviceState].apply(this);
  }
  
  connectingInterval = setInterval(function(){
    global["connectingCommand"] = global["connectingCommand"] == "set" ? "clear" : "set";
    
    serialPort.write("gpio "+global["connectingCommand"]+" 0\n\r", function(err, results) { 
      if(err) {
        console.log('err ' + err);
      } else {
        console.log('results: ' + results);
        currentDeviceState = "connecting";
        sendNotificationToServer(currentDeviceState,'device',(new Date()),macAddress);
      }
    });
  },100);
}

function changeDeviceFromLostPower() {
  serialPort.write("gpio clear 0\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      clearInterval(connectingInterval);
    }
  });
}

function changeDeviceToLostPower() {
  if(currentDeviceState == "lostPower"){ return; }
  
  if(global["changeDeviceFrom" + currentDeviceState]) {
    global["changeDeviceFrom" + currentDeviceState].apply(this);
  }
  
  connectingInterval = setInterval(function(){
    global["connectingCommand"] = global["connectingCommand"] == "set" ? "clear" : "set";
    
    serialPort.write("gpio "+global["connectingCommand"]+" 0\n\r", function(err, results) { 
      if(err) {
        console.log('err ' + err);
      } else {
        console.log('results: ' + results);
        currentDeviceState = "lostPower";
        sendNotificationToServer(currentDeviceState,'device',(new Date()),macAddress);
      }
    });
  },30000);
}

function changeDeviceFromConnected() {
  serialPort.write("gpio clear 0\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      clearInterval(connectingInterval);
    }
  });
}

function changeDeviceToConnected() {
  console.log("~~~~~~~~ " + currentDeviceState)
  if(currentDeviceState == "connected"){ return; }
  
  if(global["changeDeviceFrom" + currentDeviceState]) {
    global["changeDeviceFrom" + currentDeviceState].apply(this);
  }
  
  console.log("~~~~~~~~ OK")

  serialPort.write("gpio set 0\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      currentDeviceState = "connected";
      sendNotificationToServer(currentDeviceState,'device',(new Date()),macAddress);
    }
  });
}



///// LEVEL STATE CHANGES

function changeLevelFromViolation() {
  serialPort.write("gpio clear 2\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
    }
  });
}

function changeLevelToViolation() {
  if(currentLevelState == "violation"){ return; }
  
  if(global["changeLevelFrom" + currentLevelState]) {
    global["changeLevelFrom" + currentLevelState].apply(this);
  }
  

  serialPort.write("gpio set 2\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      currentDeviceState = "violation";
      sendNotificationToServer(currentLevelState,'level',(new Date()),macAddress);
    }
  });
}

function changeLevelFromWarning() {
  serialPort.write("gpio clear 1\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
    }
  });
}

function changeLevelToWarning() {
  if(currentLevelState == "warning"){ return; }
  
  if(global["changeLevelFrom" + currentLevelState]) {
    global["changeLevelFrom" + currentLevelState].apply(this);
  }
  

  serialPort.write("gpio set 1\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      currentDeviceState = "warning";
      sendNotificationToServer(currentLevelState,'level',(new Date()),macAddress);
    }
  });
}

function changeLevelFromNormal() {
  if(currentDeviceState == "connecting" || currentDeviceState == "lostPower") {
    return; /// don't turn off the GPIO if the device is in one of these states
  }
  
  
  serialPort.write("gpio clear 0\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      clearInterval(connectingInterval);
    }
  });
}

function changeLevelToNormal() {
  if(currentLevelState == "normal"){ return; }
  
  if(global["changeLevelFrom" + currentLevelState]) {
    global["changeLevelFrom" + currentLevelState].apply(this);
  }

  serialPort.write("gpio set 0\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      currentDeviceState = "normal";
      sendNotificationToServer(currentLevelState,'level',(new Date()),macAddress);
    }
  });
}

function sendDataToServer(deviceState,levelState,db,timestamp,deviceId) {
  console.log("This is the data we're going to try and send to the server:");
  console.log("DB: " + db);
  console.log("Timestamp: " + timestamp);
  console.log("deviceId: " + deviceId);
  
  request({
    uri: 'https://dropmic.herokuapp.com/recordings',
    method: 'POST',
    json: {levelState: levelState, deviceState: deviceState, dbValue: db, recordedAt: timestamp, mac: deviceId }
  },
  function (error, response, body) {
    if(response && response.statusCode == 200){
      console.log('data saved')
      
      changeDeviceToConnected();
      
    } else {
      changeDeviceToConnecting();
      
      if(response.statusCode) {
          console.log('error: '+ response.statusCode)
      } else {
        console.log(response)
      }

      console.log("There was some sort of error connecting to the server. Let's try again in 10 seconds.")
      setTimeout(function(){ 
        sendDataToServer(currentDeviceState,currentLevelState,db,timestamp,deviceId)
      },10000)
    }
  })
}

function sendNotificationToServer(theState,stateType,timestamp,deviceId) {
  console.log("This is the data we're going to try and send to the server:");
  console.log("STATE: " + theState);
  console.log("Timestamp: " + timestamp);
  console.log("deviceId: " + deviceId);
  
  request({
    uri: 'https://dropmic.herokuapp.com/notifications',
    method: 'POST',
    json: {
      notificationValue: theState,
      notificationSubject: stateType == "level" ? "Device level state change" : "Device status state change",
      notificationMessage: "Device " + deviceId + "is now: " + theState,
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
        sendDataToServer(currentDeviceState,currentLevelState,db,timestamp,deviceId)
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
    var lastState = currentLevelState;
    
    if(avg > errorThreshold) {
      changeLevelToViolation();
    } else if(avg > warningThreshold) {
      changeLevelToWarning();
    } else {
      changeLevelToNormal();
    }
    
  }
  
  // console.log("dBFS: " + dBFS);
  // console.log("calibratedDBFS: " + calibratedDBFS)
  // console.log("DB: " + db)

  return inputBuffer;
}

function main() {
  fs.readFile(path.join(__dirname, 'error-threshold.txt'), {encoding: 'utf-8'}, function(err,data){
    if (!err) {
      errorThreshold = parseFloat(data);
      
      console.log("WE GOT THE ERROR THRESHOLD: " + errorThreshold);
    
      fs.readFile(path.join(__dirname, 'trim-value.txt'), {encoding: 'utf-8'}, function(err,data){
        if (!err) {
          console.log(data);
          trimValue = parseFloat(data);
    
          if(!trimValue) {
            console.log("DIEEEEEEEE");
          } else {
        
            setInterval(function() { //every second, send the data to the server
              if(db && isFinite(db)) {
                sendDataToServer(currentDeviceState,currentLevelState,db,(new Date()),macAddress);
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
    } else {
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

serialPort.open(function (error) {
  if ( error ) {
    console.log('failed to open: ' + error);
    return;
  }
  
  serialPort.write("\n\r", function(err, results) {
    serialPort.write("\n\r", function(err, results) {
      console.log("~~~~~~~~ connecting!!!!")
      changeDeviceToConnecting();
    });
  });
});


// console.log(engine.read())



main();







// console.log(engine.getDeviceName(0));
// console.log(engine.getDeviceName(1));
// console.log(engine.getDeviceName(2));
// console.log(engine.getDeviceName(3));