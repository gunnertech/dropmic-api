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
    $ apt-get update
    $ apt-get dist-upgrade
    $ apt-get upgrade
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



