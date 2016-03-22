var fs = require('fs');
var childProcess = require('child_process');
var path = require('path');
 
var samples = [];
var savedTrimValue = null;

var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', function(line){
    var rms = parseFloat(line.trim());
    processAudio(rms)
})

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
 
function processAudio(rms) {
  if(savedTrimValue) { return; }
  
  expectedDBFS = 94.0;
  actualDBFS = 20 * Math.log10(rms);
  trim = expectedDBFS + actualDBFS
  
  // trim = 7.65; // this is a hardcoded value for testing purposes
  
  samples.push(trim);
  
  if(samples.length > 100) {
    samples.shift();
  }
  
  var variance = getVariance( samples, 4 );
  
  
  console.log("actualDBFS: " + actualDBFS);
  console.log("trim: " + trim);
  console.log("variance: " + variance);
  
  ///ONCE THE VARIANCE DROPS BELOW 1, WRITE THE TRIM VALUE TO A FILE, AND THEN START THE MAIN SCRIPT 
  
  if(samples.length > 90 && variance < 1) {
    savedTrimValue = trim;
    fs.writeFile(path.join(__dirname, 'trim-value.txt'), savedTrimValue, function(err) {
        if(err) { return console.log(err); }

        console.log("The file was saved!");
        
        runScript('./run.js', function (err) {
          if (err) throw err;
          console.log('finished run.js');
        });
    }); 
  }
}

