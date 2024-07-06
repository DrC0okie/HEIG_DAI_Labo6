const { v4: uuidv4 } = require('uuid');
const dgram = require('dgram');
const protocol = require('./protocol');
const socket = dgram.createSocket('udp4');
const uuid = uuidv4();
const INTERVAL = 1000;

//Getting the instrument passed as argument
const instrumentName = process.argv[2];

//Control if this is a valid instrument
if (!instrumentName || !protocol.INSTRUMENTS.hasOwnProperty(instrumentName)) {
    console.log('Invalid instrument ' + instrumentName);
    return;
}

// Here we create the json to be sent to the auditor
const data = JSON.stringify({
    uuid, sound: protocol.INSTRUMENTS[instrumentName],
});

//We send the datagram every 1 second to the multicast group
setInterval(() => {
    socket.send(Buffer.from(data), 0, data.length, protocol.PORT, protocol.HOST, () => {
        console.log('Send new data: ' + data + ' to port ' + socket.address().port);
    });
}, INTERVAL);
