 /*
	*	dogFactory-client.js
	*
	*	This file will be activate a socket connection with the server
	*	when the client make a new dog request. First, we need to collect
	*	the ip adress of the server. Then, we need to create a new socket connection
	*	that allows the client to create a dog image object (with DogProxy class from dog.js)
	*	We need to pass a serialized object inside the socket connection, that's why we call
	*	the serial function from the Dog class.
*/

let DogProxy = require('../lib/dog').DogProxy;
let io = require('socket.io-client');



let serverAdress = null;
// Acess adress of the server
let setup = function(_Adress) {
	serverAdress = _Adress;
} 



// Creating a new socket connection with the server and a new dogProxy object
let _push = function (name, event = null) {
	let socket = io.connect(serverAdress, {reconnect: true});
	console.log(serverAdress + ' SERVER ADRESS');
	let dogImage = new DogProxy(name);

	socket.on('connect', function() {
		let msg = { 'type'  : event != null ? 'event' : 'other',
				   'value' : event, 
				   'data'  : dogImage.serial()
		};
		//console.log('Sending newborn event with the socket connection: ')
		socket.emit('newBorn', msg);
	})
	//When server give a response (dogUpdate event)
	.on('dogUpdate', (msg) => { 
		// console.dir(msg);
		if (msg.type === 'event') {    
				dogImage.serial(msg.data)
			 	dogImage.emit(msg.value, dogImage);
		}
		else{
			console.log('No events occured');
		}
	});
	return dogImage;
}

// Exporting push and setup function
module.exports = {
	push: _push,
	setup: setup
}

