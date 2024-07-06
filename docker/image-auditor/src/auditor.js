//Protocol
const protocol = require('./protocol');

//UDP
const dgram = require('dgram');

//TCP
const net = require('net');

//HTTP
const HTTP_PORT = 3000;
const ejs = require('ejs');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const ACTIVE_INTERVAL = 5000;
const TCP_PORT = 2205;
const musicians = new Map();
const longDateFormat = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute : 'numeric', second: '2-digit'};

app.use(express.static('public'));
app.set('view engine', 'ejs');

//Creation of the HTTP server (Yes we did a little more than what was asked us to do)
http.listen(HTTP_PORT, () => {
    console.log('Listening on port ' + HTTP_PORT);
});

// Here we render the HTML page the first time
app.get('/', (req, res) => {
    res.render('index', {
        musicians: Array.from(musicians.entries()).map(([uuid, {instrument, activeSince, upTime}]) => ({
            uuid,
            instrument,
            activeSince: new Date(activeSince).toLocaleDateString("en-US", longDateFormat),
            upTime: new Date(upTime).getSeconds()
        }))
    });
});

//Update the data on the HTML page
setInterval(() => {
    //Here we want to display the upTime property of the map, so we don't format it
    io.emit('newData', removeInactive(musicians));
}, 1000);

// Creation of the UDP server
const socket = dgram.createSocket('udp4');
socket.bind(protocol.PORT, () => {
    console.log('Joining multicast group on port ' + protocol.PORT);
    socket.addMembership(protocol.HOST);
});

//Each time a UDP datagram is received
socket.on('message', (msg, {port}) => {
    //Parse the JSON
    const {uuid, sound} = JSON.parse(msg);

    //Find the instrument corresponding to the sound
    const instrument = Object.keys(protocol.INSTRUMENTS).find((i) => protocol.INSTRUMENTS[i] === sound);

    // Update the active time
    const activeSince = musicians.has(uuid) ? musicians.get(uuid).activeSince : Date.now();

    //Set the map with the updated data + the upTime data
    musicians.set(uuid, {uuid, instrument, activeSince, upTime: Date.now()});
    console.log('Received new data: ' + instrument + '. Port: ' + port);
});

//TCP server that listens to the specific port
const server = net.createServer();
server.listen(TCP_PORT);

//Each time a client connects to the TCP server
server.on('connection', socket => {
    //Format the map as we don't need the upTime property to be displayed in the TCP server
    socket.write(JSON.stringify(Array.from(removeInactive(musicians).entries()).map(([uuid, musician]) => ({
        uuid, instrument: musician.instrument, activeSince: new Date(musician.activeSince)}))) + '\n');
    socket.end();
});

//Update the musicians map to get only the active musicians
function removeInactive(musicians) {
    return Array.from(musicians.entries())
        .filter(([uuid, musician]) => {
            const toRemove = Date.now() - musician.upTime > ACTIVE_INTERVAL;
            if (toRemove) {
                musicians.delete(uuid);
            }
            return !toRemove;
        })
        .map(([uuid, musician]) => ({
            uuid,
            instrument: musician.instrument,
            activeSince: new Date(musician.activeSince).toLocaleDateString("en-US", longDateFormat),
            upTime: new Date(musician.upTime - musician.activeSince).getSeconds()
        }));
}