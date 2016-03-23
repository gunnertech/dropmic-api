# Dropmic 

## Machine Setup

TODO

## Device Setup


### Local Machine
    $ ifconfig
    $ ping 192.168.0.255
    $ nmap -sP 192.168.0.*
    $ scp -r ~/workspace/javascript/node/dropmic/embed root@192.168.0.100:~


### Device

    $ bananian-config
    $ reboot
    $ bananian-update
    $ apt-get update --yes
    $ apt-get dist-upgrade --yes
    $ apt-get upgrade --yes
    $ apt-get install python-dev --yes 
    $ apt-get install libasound-dev  --yes 
    $ apt-get install libasound2-plugins --yes 
    $ apt-get install alsa-utils --yes
    $ apt-get install libasound2-doc --yes
    $ apt-get install --yes curl
    $ apt-get install --yes git
    $ curl -sL https://deb.nodesource.com/setup_5.x | bash -
    $ apt-get install --yes nodejs
    $ apt-get install --yes build-essential
    $ npm install npm -g
    $ npm install -g node-gyp
    $ cd embed
    $ rm -rf ~/embed/node_modules
    $ npm install prompt 
    $ npm install autorecordmic
    $ npm install getmac
    $ npm install request
    $ npm install serialport
    $ npm install git+https://git@github.com/vsukhomlinov/node-core-audio
    ///gpio




apt-get update; apt-get dist-upgrade; apt-get upgrade

    apt-get install python-dev  libasound-dev   libasound2-plugins  alsa-utils libasound2-doc curl git
    
    apt-get install portaudio19-dev libportaudio2 libportaudiocpp0 pulseaudio --yes
    
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.0/install.sh | bash
    nvm install v5.7.0
    nvm alias default v5.7.0
    
    npm install git+https://github.com/Escaux/node-core-audio
    
    
    cd node_modules/node-core-audio/
    rm -rf portaudio/
    wget http://www.portaudio.com/archives/pa_stable_v19_20140130.tgz
    tar -xvzf pa_stable_v19_20140130.tgz
    cd portaudio
    ./configure
    make install
    
    cd ..
    
    Then i changed the binding.gyp file in the module folder, especially the linux part

    'OS=="linux"', {
    "libraries" : [
    '<(module_root_dir)/portaudio/lib/.libs/libportaudio.so',
    '<(module_root_dir)/portaudio/include/portaudio.h'
    ],
    'cflags': [ "-fno-exceptions -lrt -lasound -ljack -lpthread -fPIC" ],
    'cflags!': [ "-fno-exceptions-lrt -lasound -ljack -lpthread -fPIC" ],
    'cflags_cc!': [ "-fno-exceptions -lrt -lasound -ljack -lpthread -fPIC"],
    'cflags_cc': [ "-std=c++0x -lrt -lasound -ljack -lpthread -fPIC" ]
    }
    
    node-gyp rebuild
    
    
    env PULSE_LATENCY_MSEC=300 pulseaudio -k ; pulseaudio -D --log-target=syslog

    
    
  
    
    pacat -r --device=alsa_input.usb-Blue_Microphones_Yeti_Stereo_Microphone_REV8-00-Microphone.analog-stereo | sox -d -t dat -p
    
    
    pacat -r --device=alsa_input.usb-miniDSP_Umik-1_Gain__18dB_00002-00-U18dB.analog-stereo