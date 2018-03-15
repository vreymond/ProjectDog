/*
	* 	dogWarehouse-client.js
	*
	*	Client that initialize a socket connection with the warehouse server part.
	*	Function fetch that request a dog check in the warehouse
	*	Function push that send a dead dog to the warehouseDB
*/

const EventEmitter = require('events');
let io = require('socket.io-client');

let emitter = new EventEmitter();
let serverAdress = null;

let setup = function(_Adress){
	serverAdress = _Adress;
}

/*
	Function initialize a socket connection with warehouse-server.js
	If docDetected event occured inside the socket connection, we transmit
	data to the index.js findDogAsync function.
*/
// rename fetchDog
let fetchWarehouse = function (dogValueConstraints){
	let fetchWarehouseEmitter = new EventEmitter();
	let socket = io.connect(serverAdress, {reconnect: true});
	//console.log(serverAdress + ' SERVER ADRESS');
	socket.on('connect', function(){
		//console.log('SOCKET EMISSION')
		socket.emit('warehouseFetch', makePacket(dogValueConstraints, event = 'warehouseFetch'));
	})
	// Listening to the dogDetected event from warehouse micro-service
	.on('docDetected', (msg) => {
		if (msg.value === 'docFound'){
			fetchWarehouseEmitter.emit('data', msg.data);
		}
		else {

			fetchWarehouseEmitter.emit('data', null);
		}
	});

	return fetchWarehouseEmitter;
}

/*
	Function allows a view to request a topology of a family from the couchDB database
*/
let fetchTopo = function(familyID){
	let fetchTopoEmitter = new EventEmitter();
	let socketTopo = io.connect(serverAdress, {reconnect: true});

	socketTopo.on('connect', function(){
		socketTopo.emit('topoFetch', makePacket(familyID, event = 'topoFetch'));
	})
	.on('topoDetected', (msg) => {
		if (msg.value === 'topologyFound'){
			fetchTopoEmitter.emit('topology', msg.data);
		}
		else {
			fetchTopoEmitter.emit('topology', null);
		}
	})
	return fetchTopoEmitter;
}

/*
	Function allows a view to request a family from the couchDB database
*/
let fetchFamily = function(familyID){
	let fetchFamilyEmitter = new EventEmitter();
	let socketFamily = io.connect(serverAdress, {reconnect: true});

	socketFamily.on('connect', function(){
		socketFamily.emit('familyFetch', makePacket(familyID, event = 'familyFetch'));
	})
	.on('familyDetected', (msg) => {
		if (msg.value === 'familyFound'){
			fetchFamilyEmitter.emit('familyData', msg.data);
		}
		else {
			fetchTopoEmitter.emit('familyData', null);
		}
	})
	return fetchFamilyEmitter;
}

/*
	Simple packet creator function, it used by a lot of others function in this file
*/
function makePacket(data, event = null){
	let msg = {	'type' : event != null ? 'event' : 'other',
				'value' : event,
				'data' : data
	}
	return msg
}

/*
	Function that will open a socket connection to add an object to the warehouse database
*/
let push = function (addObjToDB) {
	let pushEmitter = new EventEmitter();
	let socketAdd = io.connect(serverAdress, {reconnect: true});
	
	socketAdd.on('connect', function(){
		socketAdd.emit('objToWarehouse', makePacket(addObjToDB, event = 'objToWarehouse'));
	})
	.on('addingDone', (msg) => {
		if (msg.value === 'addSucceed'){
			pushEmitter.emit('addResult', msg.data);
		}
		else {
			pushEmitter.emit('addResult', msg.data);
		}
	})
	return pushEmitter;
}

module.exports = {
	setup: setup,
	fetchWarehouse: fetchWarehouse,
	fetchFamily: fetchFamily,
	fetchTopo: fetchTopo,
	push: push
	
}