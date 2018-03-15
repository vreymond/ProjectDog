/*
	*	motor-server.js
	*
	*	This file will start the server.
	* 	A listener is waiting for a 'newDog' event and it will create a new dog Object
	* 	Next, this file will create a listener on th 'older' event on this new dog object
	*	If this event is emitted, this file will push data inside a "packet" that contains
	*	the vent name and the data.
*/
const EventEmitter = require('events');
let Dog = require('../lib/dog').Dog;
let DogProxy = require('../lib/dog').DogProxy;
let server = require('./dogFactory-server');
let warehouseCall = require('../lib/dogWarehouse-client.js');
let program = require('commander');

let debug = false;

// Command line management. Debug mode, if given change debug variable to true
program
  .option('-d, --debug', 'Debug mode on')
  .parse(process.argv);

if(program.debug) debug = true;
if(debug) server.debugOn(); // If debug, calling debugOn function from dogFactory-server

// Starting server with the start function from dogFactory-server file
server.start();

//Setup for fetching a dog in warehouse (for the connection)
warehouseCall.setup('http://localhost:5000')

let dogPark = {}

// A client ask a new dog
server.on('newDog', (packet) => {
	if(debug){
		console.log('New dog request from client:');
		console.dir(packet.data());
	} 
	//console.dir(packet.data());
	findDogAsync(packet.data()).on('resultFetchWarehouse', (dogObj) => {
		if(debug){
			console.log('Result from fetching the warehouse:');
			console.log(dogObj);
		}
		// Listener on 'older' event, and transmit dog Object data inside a packet
		dogObj.on('older', () => {
			packet.data(dogObj.serial());
			//console.dir(packet._data);
			server.push(event = 'older', packet = packet );
		})
		.on('deadDog', (dogObjDead) => {
			// clean reference to dead dog
			console.log(dogObjDead._id + ' is dead!');
			delete dogPark[dogObjDead._id];
			warehouseCall.push(dogObjDead.serial());
			server.push(event = 'deadDog', packet = packet)
		});
	}).on('resurrected', (dogObj) => {
		dogObj.emit('deadDog',dogObj)
		packet.data(dogObj.serial());
		console.log(dogObj._id + ' is resurrected!');
		//console.dir(dogPark);
		server.push(event = 'deadDog', packet = packet)
	})
});

/*
	Function called every time a view asking a dog creation request.
	First, if the unique id of that new dog (name) is not referenced in the dogPak object,
	we need to execute a fetch to the warehouse microservice to check if this dog was already 
	created but dead. If a dog is found with this unique name in the warehouse, we get back this
	dog object from de the warehouse. If no dog found, we re-check in the dogPark is a dog with the unique key is present, 
	to prevent multiple view concurrency, and then we create a new dog.
	Or, if a dog reference is already in the dogPark object, we just redirect the client asking for this dog to that reference.
*/
function findDogAsync(dogValueConstraints){
	let emitter = new EventEmitter();
	let name = dogValueConstraints._id;

	// if the dog not in dogPark
	if (!dogPark.hasOwnProperty(name)){
		warehouseCall.fetchWarehouse(dogValueConstraints).on('data', (data) => {
			//console.log('DOGNAME ' + dogName);
			
			let tmpDogObj;
			if (data) { // dog found in warehouse
				
				tmpDogObj = new DogProxy(data[0]._id)

				// TO DO: emit dead event to the dog from warehouse
				// deserialize data into a dog object and dont put it in dogPark
				tmpDogObj.serial(data[0])
				emitter.emit('resurrected', tmpDogObj);
			} 
			else { // no dog found in warehouse
				//In case of concurrent fetching (other client for the same dog)
				if (dogPark.hasOwnProperty(name)){
					console.log('Concurrent fetching with other client')
				}
				else{
					console.log('NOT FOUND')
					dogPark[name] = new Dog(name);
				}
				
				tmpDogObj = dogPark[name];
				emitter.emit('resultFetchWarehouse', tmpDogObj);
			}
			// emit dogFound event, and give tmpDogObj that contains a dog object (previously deserialized)
		});
		
	} 
	// if dog in dogPark, returning the reference of the living dog to the view
	else {
		setTimeout(function() {
			tmpDogObj = dogPark[name];
			emitter.emit('resultFetchWarehouse', tmpDogObj);
		},10);
		
	}
	return emitter;
}