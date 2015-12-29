// Create a new instance of node-core-audio 
var coreAudio = require("node-core-audio");
var fs = require('fs');
var childProcess = require('child_process');
 
// Create a new audio engine 
var engine = coreAudio.createNewAudioEngine();
var samples = [];

function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

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
    var sample = input[j] // 32768.0
    total += (sample * sample);
  }
  
  rms = Math.sqrt(total / (len / 2));
  expectedDBFS = 94.0;
  actualDBFS = 20 * Math.log10(rms);
  trim = expectedDBFS + actualDBFS
  
  samples.push(trim);
  
  if(samples.length > 100) {
    samples.shift();
  }
  
  var variance = getVariance( samples, 4 );
  
  
  console.log("actualDBFS: " + actualDBFS);
  console.log("trim: " + trim);
  console.log("variance: " + variance);
  
  if(samples.length > 90 && variance < 1) {
    fs.writeFile(path.join(__dirname, 'trim-value.txt'), trim, function(err) {
        if(err) { return console.log(err); }

        console.log("The file was saved!");
        
        runScript('./run.js', function (err) {
          if (err) throw err;
          console.log('finished run.js');
        });
        
    }); 
  }
  
  
  

  return inputBuffer;
}

engine.setOptions({
  inputChannels: 1,
  inputDevice: 0,
  outputChannels: 1
});

// console.log(engine.read())

engine.addAudioCallback( processAudio );

console.log(engine.getNumDevices());

// console.log(engine.getDeviceName(0));
// console.log(engine.getDeviceName(1));
// console.log(engine.getDeviceName(2));
// console.log(engine.getDeviceName(3));