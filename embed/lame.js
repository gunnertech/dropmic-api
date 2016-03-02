var isMacOrWin = require('os').type() == 'Darwin' || require('os').type().indexOf('Windows') > -1;
var spawn = require('child_process').spawn
var PassThrough = require('stream').PassThrough;

var ps = null;

var audio = new PassThrough;
var info = new PassThrough;

var start = function(options) {
    options = options || {};
    
    if(ps == null) {
        ps = isMacOrWin
        ? spawn('sox', ['-d', '-t', 'dat', '-p'])
        : spawn('arecord', ['-D', 'plughw:1,0', '-f', 'dat']);


        ps.stdout.pipe(audio);
        ps.stderr.pipe(info);

    }
};

var stop = function() {
    if(ps) {
        ps.kill();
        ps = null;
    }
};

// exports.audioStream = audio;
// exports.infoStream = info;
// exports.startCapture = start;
// exports.stopCapture = stop;


// var mic = require('microphone');
//
// mic.startCapture();
//
// mic.audioStream.on('data', function(data) {
//     process.stdout.write(data);
// });

audio.on('data', function(input) {
  var len = input.length
  , total = i = 0
  , rms
  , trim
  , dBFS;
  
  for ( var j = 0; j < len; j = j + 16) {
    var sample = input[j] / 256; //((input[j] - 128) * 128) / 32768.0;
    total += (sample * sample);
  }
  
  rms = Math.sqrt(total / (len / 16));
  dBFS = 20 * Math.log10(rms);
  // trim = trimValue; // 7.65 //From calibrate.js
//   calibratedDBFS = dBFS + trim;
//   givenDb = 94.0 //The value the calibration device sends
//
//   db = dBFS + trim + givenDb //need to convert dbfs to db
//
//   samples.push(db);
//
//
//   if(samples.length > lengthToAverage) {
//     console.log("OK. We're in business")
//     samples.shift();
//
//     var sum = 0;
//     for( var i = 0; i < samples.length; i++ ){
//         sum += parseInt( samples[i], 10 ); //don't forget to add the base
//     }
//
//     var avg = sum/samples.length;
//     var lastState = currentLevelState;
//
//     // if(avg > errorThreshold) {
//     //   changeLevelToViolation();
//     // } else if(avg > warningThreshold) {
//     //   changeLevelToWarning();
//     // } else {
//     //   changeLevelToNormal();
//     // }
//
//   }
//
  console.log("dBFS: " + dBFS);
})

start();