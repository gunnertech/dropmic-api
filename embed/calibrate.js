var fs = require('fs');
var childProcess = require('child_process');
var path = require('path');
var http = require("http");
var request = require('request');
var SerialPort = require("serialport").SerialPort;


var samples = [];
var lengthToAverage = 1; //10000; //TODO: What should this value be?
var errorThreshold = 100; //TODO: Just guessing here
var warningThreshold = errorThreshold - 10;
var currentDeviceState = ""; //,yellow,red
var currentLevelState = ""; //,yellow,red
var savedTrimValue = null;
var db = null;
var macAddress = null;
var serialPort = null;
var httpTimer = null;

// var readline = require('readline');
// var rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
//   terminal: false
// });

// rl.on('line', function(line){
//   var rms = parseFloat(line.trim());
//   processAudio(rms)
// })

///// DEVICE STATE CHANGES

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

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
  console.log("CONNECTING ~~~~~~~~ " + toTitleCase(currentDeviceState))
  if(currentDeviceState == "connecting"){ return; }
  
  if(currentDeviceState){ eval("changeDeviceFrom" + toTitleCase(currentDeviceState) + "()"); }
  
  
  connectingInterval = setInterval(function(){
    global["connectingCommand"] = global["connectingCommand"] == "set" ? "clear" : "set";
    
    serialPort.write("gpio "+global["connectingCommand"]+" 0\n\r", function(err, results) { 
      if(err) {
        console.log('err ' + err);
      } else {
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
  
  if(currentDeviceState){ eval("changeDeviceFrom" + toTitleCase(currentDeviceState) + "()"); }
  
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
  if(currentDeviceState == "connected"){ return; }
  
  if(currentDeviceState){ eval("changeDeviceFrom" + toTitleCase(currentDeviceState) + "()"); }
  

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
  
  eval("changeLevelFrom" + toTitleCase(currentLevelState) + "()");
  

  serialPort.write("gpio set 2\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      currentLevelState = "violation";
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
  
  eval("changeLevelFrom" + toTitleCase(currentLevelState) + "()");
  

  serialPort.write("gpio set 1\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      currentLevelState = "warning";
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
  
  if (currentLevelState) {
    eval("changeLevelFrom" + toTitleCase(currentLevelState) + "()");
  }

  serialPort.write("gpio set 0\n\r", function(err, results) { 
    if(err) {
      console.log('err ' + err);
    } else {
      console.log('results: ' + results);
      currentLevelState = "normal";
      sendNotificationToServer(currentLevelState,'level',(new Date()),macAddress);
    }
  });
}

function sendDataToServer(deviceState,levelState,db,timestamp,deviceId) {
  if(!deviceId){ return; }
  
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
      console.log("~~~~~~~~ CHANGING AGAIN");
      
      changeDeviceToConnecting();
      
      if(response) {
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
  if(!deviceId){ return; }

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


function getNumWithSetDec( num, numOfDec ){
  var pow10s = Math.pow( 10, numOfDec || 0 );
  return ( numOfDec ) ? Math.round( pow10s * num ) / pow10s : num;
}

function getAverageFromNumArr( numArr, numOfDec ){
  var i = numArr.length, 
  sum = 0;
  while( i-- ){
    sum += numArr[ i ];
  }
  
  return getNumWithSetDec( (sum / numArr.length ), numOfDec );
}

function getVariance( numArr, numOfDec ){
	var avg = getAverageFromNumArr( numArr, numOfDec ), 
  i = numArr.length,
  v = 0;

  while( i-- ){
    v += Math.pow( (numArr[ i ] - avg), 2 );
  }
  v /= numArr.length;
  return getNumWithSetDec( v, numOfDec );
}

function processAudio(rms) {
  console.log('tick');
  console.log(rms);

  var expectedDBFS = 94.0; //The value the calibration device sends
  var actualDBFS = 20 * Math.log10(rms);
  var trim;

  savedTrimValue = fs.readFileSync(path.join(__dirname, 'trim-value.txt'), {encoding: 'utf-8'});
  

  if (!httpTimer) {
    httpTimer = setInterval(function() { //every second, send the data to the server
      if(db && isFinite(db) && currentDeviceState && currentLevelState && macAddress) {
        sendDataToServer(currentDeviceState,currentLevelState,db,(new Date()), macAddress);
      }
    }, 1000);
  }

  if(!macAddress) {
    require('getmac').getMac(function(err,ma){
      macAddress = ma;
    });
  }

  if(savedTrimValue) { //it's calibrated. Let's get the db and send it along
    console.log("OK. We're calibrated");
    savedTrimValue = parseFloat(savedTrimValue);
    db = actualDBFS + savedTrimValue + expectedDBFS;

    samples.push(db);
    
    console.log(samples.length);

    if(samples.length > lengthToAverage) {
      console.log("OK. We're in business")
      samples.shift();
      
      var sum = 0;
      for( var i = 0; i < samples.length; i++ ){
          sum += parseInt( samples[i], 10 ); //don't forget to add the base
      }

      var avg = sum/samples.length;
      var lastState = currentLevelState;

      if (serialPort) {
        console.log("We've got GPIO!");
        if(avg > errorThreshold) {
          changeLevelToViolation();
        } else if(avg > warningThreshold) {
          changeLevelToWarning();
        } else {
          changeLevelToNormal();
        }
      } else {
        console.log("We need to connect GPIO");

        fs.readdir('/dev', function(err, items){
          if (err) throw err;
          for (var i=0; i<items.length; i++) {
            if(items[i].match(/tty\.usbmodem/) || items[i].match(/ttyACM/)) {
              serialPortLocation = "/dev/"+items[i];
              serialPort = new SerialPort(serialPortLocation, {
                baudrate: 9600
              },false);

              serialPort.open(function (error) {
                if ( error ) {
                  console.log('failed to open: ' + error);
                  return;
                }

                main();

                serialPort.on('data', function(data) {
                  var dataString = data.toString();
                  if(dataString.match(/gpio read 3/)){
                    if(dataString.match(/0/)) { //it's on
                      console.log("^^^^ We lost power!")
                      changeDeviceToConnected();
                    } else { //it's off
                      console.log("^^^^ We lost power!")
                      changeDeviceToLostPower();
                    }
                  }
                });

                serialPort.write("\n\r", function(err, results) {
                  serialPort.write("\n\r", function(err, results) {
                    console.log("~~~~~~~~ connecting!!!!")
                    changeDeviceToConnecting();
                    setInterval(function(){
                      serialPort.write("gpio read 3\n\r", function(err, results) {
                        if(err) {
                          console.log('!!!!!!!!! err ' + err);
                        } else {
                          console.log('!!!!!!!!! results: ' + results);
                        }
                      });
                    },10000);
                  });
                });
              });

            }
          }
        });

      }
    }
     
  } else { //need to calibrate this shit first
    console.log("Shit. We need to calibrate.");

    trim = expectedDBFS + actualDBFS
    
    
    samples.push(trim);
    
    if(samples.length > 100) {
      samples.shift();
    }
    
    var variance = getVariance( samples, 4 );

    ///ONCE THE VARIANCE DROPS BELOW 1, WRITE THE TRIM VALUE TO A FILE, AND THEN START THE MAIN SCRIPT 
    
    if(samples.length > 90 && variance < 1) {
      savedTrimValue = trim;
      fs.writeFile(path.join(__dirname, 'trim-value.txt'), savedTrimValue, function(err) {
        if(err) { return console.log(err); }

        console.log("The file was saved!");
      }); 
    }

  }
}

function main() {
  console.log("     Running it     ".trim());

  var exec = require('child_process').exec;
  var recCmd = 'rec  -c 2 ./tmp_rec.wav trim 0 1;';
  var soxCmd = "sox  -t .wav ./tmp_rec.wav -n stat 2>&1 | grep \"Maximum amplitude\" | cut -d ':' -f 2 | cat";

  exec(recCmd, function(error, stdout, stderr) {
    console.log('recorded');
    exec(soxCmd, function(error, stdout, stderr) {
      console.log('soxed');
      var rms = parseFloat(stdout.trim());
      processAudio(rms);
    });    
  });

}

setInterval(main,1000);

