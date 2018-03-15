/*
	*	dogFactory-server.js
	*
	*	This file define a class wrapper to keep the socket reference and the data inside the connection
	*	A start and push function established a connection between the client and the server
	*	on the port 3000.  Push will return a message to the client to contains a event and the data
	*	
*/

// Require DogProxy class, server is listening on the port 3000
let DogProxy = require('../lib/dog').DogProxy;
let io = require('socket.io').listen(3000);
const EventEmitter = require('events');
let packetManager = require('../lib/packetManager')

let debug = false;
let emitter = new EventEmitter();
// activate debug mode for the server part
let debugOn = () => {debug = true;}

/*
	Function starting listening on a port
*/
let start = function() {
	io.on('connection', function(socket) {
		//console.log('New socket connection detected');
		socket.on('newBorn', (msg) => {
			let packet = new packetManager(socket);
			packet.data(msg.data)
			if (msg.type === 'event'){
				if (msg.value === 'newDoc'){
					emitter.emit('newDog', packet)
				}
				else {
					console.log('ERROR: Event not known')
				}
			}
			//console.log(dogSerial)
			// Client request a new dog born
			//let packet = new packetManager(socket);
			//packet.data(dogSerial);
			//emitter.emit('newDog', packet);
		})
	})
}


//	Returning data from the real dog object to the dogProxy object (client)
let _push = function(event = null, packet = null) {
		//console.log("************dog resurrected************")
		//console.log(packet._data)
		//console.log("************dog resurrected************")
	
	
	let msg = { 'type'  : event != null ? 'event' : 'other',
				   'value' : event, 
				   'data'  : packet.data() 
	};
	//console.log(packet.data);
	console.log('Sending package')
	console.dir(msg)
	
	packet.socket.emit('dogUpdate', msg);
}

// Exporting start, push, and on function
module.exports = {
	start: start,
	on: function(eventName, callback) {
    	emitter.on(eventName, callback);
    	// should allow chaining  w/out erasi,g singleto, referece
    	return emitter;
    },
	push: _push,
	debugOn: debugOn,
	start: start
}