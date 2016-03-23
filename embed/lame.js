#!/usr/bin/env node

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

audio.on('data', function(input) {
  var len = input.length
  , total = i = 0
  , rms
  , trim
  , dBFS;
  
  console.log("LENGTH: " + len);
  
  for ( var j = 0; j < len; j = j + 16) {
    var sample = input[j] / 256; //((input[j] - 128) * 128) / 32768.0;
    total += (sample * sample);
  }
  
  rms = Math.sqrt(total / (len / 16));
  dBFS = 20 * Math.log10(rms);

  console.log("dBFS: " + dBFS);
})

start();
