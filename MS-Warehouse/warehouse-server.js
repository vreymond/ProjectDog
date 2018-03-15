/*
	*	warehouse-server.js
	*
	*	This file is the server part from the warehouse microservice.
	*	This server is listening on a port, and wait for a socket connection.
	*	When it happens, we listen on 2 events: warehouseFetch which is called when we need to check
	*	if a dog is inside the warehouse, and the dogToWarehouse is emitted when a client need to store
	* 	a dead dog in the warehouse.

*/

// Require part. Listening on the port 5000 on socket.io
let io = require('socket.io').listen(5000);
const EventEmitter = require('events');
let packetManager = require('../lib/packetManager');
let warehouse = require('./index');

let debug = false;
let emitter = new EventEmitter();

let debugOn = () => {debug = true;}

/*
	Function called by the index.js file. We wait for a socket.io connection
	and then, we create 2 listeners for the warehouseConnect and dogToWarehouse events
*/
let start = function() {
	console.log('STARTING WAREHOUSE SERVER')
	io.on('connection', function (socket) {
		let packet = new packetManager(socket);
		socket.on('warehouseFetch', (msg) => {
			//console.log('Looking for following properties ');
			packet.data(msg.data);
			emitter.emit('fetchDoc', packet);
		})
		.on('topoFetch', (msg) => {
			packet.data(msg.data);
			emitter.emit('fetchTopology', packet);
		})
		.on('familyFetch', (msg) => {
			packet.data(msg.data);
			emitter.emit('fetchFamily', packet);
		})
		.on('objToWarehouse', function (msg){
			packet.data(msg.data);
			emitter.emit('addObj', packet);
		})
	})
}

/*
	Function that return a fetch packet if a dead dog is found inside the warehouse
	TO DO: add fetch values
*/
let push = function(fetch = null, packet = null) {

	let msg = {	'type' : fetch != null ? 'event' : 'other',
				'value' : fetch,
				'data' : packet.data()
	}
	if (fetch === 'docFound' || fetch === 'docNotFound'){
		packet.socket.emit('docDetected', msg);
	}

	if (fetch === 'topologyFound' || fetch === 'topologyNotFound'){
		packet.socket.emit('topoDetected', msg);
	}

	if (fetch === 'familyFound' || fetch === 'familyNotFound'){
		packet.socket.emit('familyDetected', msg);
	}

	if (fetch === 'addSucceed' || fetch === 'addFailed'){
		packet.socket.emit('addingDone', msg);
	}
	
	/*
	switch (true){
		case msg.value === 'docFound':
			packet.socket.emit('docDetected', msg);
		break;

		case msg.value === 'topologyFound':
			packet.socket.emit('topoDetected', msg);
		break;

		case msg.value === 'familyFound':
			packet.socket.emit('familyDetected', msg);
		break;

		default:
			console.log('RESULT:')
			console.log(msg.data)
			packet.socket.emit('notFound', msg);	
	}
	*/
}

// Exporting modules
module.exports = {
	debugOn: debugOn,
	start: start,
	push: push,
	on: function(eventName, callback){
		emitter.on(eventName, callback);
		return emitter;
	}
}

