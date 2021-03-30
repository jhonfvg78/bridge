const conf = require('./conf.json');
const axios = require('axios');
var serialport = require('serialport');
var Gpio = require('onoff').Gpio;
var led = new Gpio(4, 'out');

var ledValue = false;
var sendStatus = true;
var countSeg = 0;

setInterval(() => {
    if (sendStatus) {
        if (!ledValue) {
            led.writeSync(1);
            ledValue = true;
        }
        else {
            led.writeSync(0);
            ledValue = false;
        }
    }
    else {
        led.writeSync(1);
    }
}, 1000);

var portName = '/dev/ttyS0';

var port = new serialport(portName, {
    baudRate: conf.baudRate,
    parser: new serialport.parsers.Readline('\r\n')
});

port.on('open', onOpen);
port.on('data', onData);

function onOpen() {
    console.log('Open serialport connections!');
}

function onData(data) {
    console.log('on Data ' + data);
}

function getData() {
    axios.get(conf.url).then(async resRecords => {
        sendStatus = true;
        var IndexEnd;
        IndexEnd = resRecords.data.indexOf("psig");
        for (let IndexStart = IndexEnd; IndexStart > 0; IndexStart--) {
            if (resRecords.data.substring(IndexStart, IndexStart + 1) == '>') {
                var psig = resRecords.data.substring(IndexStart + 1, IndexEnd);
                var Ipsig = parseInt(psig, 10);
                break
            }
        }

        IndexEnd = resRecords.data.indexOf("degF");
        for (let IndexStart = IndexEnd; IndexStart > 0; IndexStart--) {
            if (resRecords.data.substring(IndexStart, IndexStart + 1) == '>') {
                var degF = resRecords.data.substring(IndexStart + 1, IndexEnd);
                var IdegF = parseInt(degF, 10);
                break
            }
        }

        IndexEnd = resRecords.data.indexOf("ppm");
        for (let IndexStart = IndexEnd; IndexStart > 0; IndexStart--) {
            if (resRecords.data.substring(IndexStart, IndexStart + 1) == '>') {
                var ppm = resRecords.data.substring(IndexStart + 1, IndexEnd);
                var Ippm = parseInt(ppm, 10);
                break
            }
        }

        var obj = {
            psig: Ipsig,
            degF: IdegF,
            ppm: Ippm
        }
        var now = new Date();        
        console.log(now.toLocaleString(),': ',obj);
        port.write(JSON.stringify(obj) + '\r\n');

    }).catch(error => {

    });
}

setInterval(() => {
    countSeg++;
    if (countSeg >= conf.timeSend) {
        sendStatus = false;
        countSeg = 0;
        getData();
    }
}, 1000);

