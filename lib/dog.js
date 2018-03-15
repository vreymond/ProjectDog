/*
	*	dog.js file
	*
	*	This file allows us to create a dog object accepting a name. 
	* 	This class Dog inherit from the Event Emitter class to authorize the
	*	creation of emitter and listener on our dog object.
	* 	Moreover, this file permit to construct a dog Proxy class, inherit from
	*	the Dog class. This one is accessible by the client side to create a image
	* 	the "real" dog object created by the Dog class.
*/

// Require on Event Emitter class, that allows to create our own events.
const EventEmitter = require('events');



// Dog class inheritance from EventEmitter
class Dog extends EventEmitter {

	// Class constructor, define name, age and diet of a dog object.
	constructor(name) {
		super();

		console.log('DOG CONSTRUCTOR FOR ' + name);
		this._id = name;
		this.type = 'dog';
		this.age = 0;
		this.diet = null;
		let self = this;
		this.intervalID = null;
		self.newBorn();
	}

	// Function allows to emit a 'born' event when a new dog object is created
	// The setTimeout make this function asynchronous
	newBorn() {	
		let self = this;
		setTimeout(function() {
			console.log('A new dog is born, his name is: ' + self._id);
			self.emit('born', self);
			// Calling older() function every 2 second
			self.intervalID = setInterval(function() {self.older()},2000);
		},10);
	}

	// This function emit a 'older' event when called. This one add +1 to selg.age variable
	// Every time this function is called, the randomNumber function is called.
	older () {
		let self = this;

		setTimeout(function () {
			self.age ++;
			self.emit('older', self);
			self.randomNumber();
		}, 10);
	}

	// Function called when the dog is older. This function choose randomly a number in a range of 5.
	// If this variable take the value 3, this function delete the dog object reference from the 
	// setInterval (with clearInterval()). And then, we emit a 'killThatDog' event
	randomNumber() {
		let killNumber = 1;
		// Give a random number between 0 to 5.
		let number = Math.floor(Math.random() * 3);
		console.log('Random number of : ' + this._id + ' is ' + number)
		console.log("\n");
		if (number === killNumber) 
			this.destroy();
		
	}

	// cleaning reference of a dog. setInterval keep a reference of a dog, with clearINterval we remove this
	destroy(){
		clearInterval(this.intervalID);
		this.emit('deadDog', this);
	}
	/* Method that serialized a dog object to json if no parameter given to this function
	   If no parameter, we deserialized by updating class attribute (for the dogProxy object)
	   intervalID is a setInterval reference, it cannot be serialized by socket.io
	   RangeError: Maximum call stack size exceeded
	   https://github.com/socketio/socket.io/issues/1665
	*/
	serial(bean){
		let self = this;
		
		// If not content
		if (!bean){
			let serializedObj = {};
			let emitterTest = new EventEmitter();

			for (let key in self) {
				if (key == 'intervalID')
					continue
				if (! EventEmitter.prototype.hasOwnProperty(key)){
					serializedObj[key] = self[key];
				}
			}

			return serializedObj;
		}		

		// If content
		// for (let key of Object.getOwnPropertyNames(self)) {
		// 	if (bean.hasOwnProperty(key)) {
  //   			//console.log(bean.key);
  //   			self[key] = bean[key];
  //   		}
  //   	}


			
		Object.getOwnPropertyNames(self).forEach(
  			function (key) {
    			if (bean.hasOwnProperty(key)) {
    				//console.log(bean.key);
    				self[key] = bean[key];
    			}

    			//This else is just a check
    			//else {
    			//	console.log(key + ' NOT IN BEAN');
    			//}
    			

  			}
  		)
  		


		
 
		/* OLD VERSION 

  		if (!bean){
			let serializedObj = {};
			console.log(Object.getOwnPropertyNames(self))
			console.log('Own Property')
			console.log(this.intervalID)
			console.log(Object.keys(self))

			Object.keys(self).slice(4).forEach(
				function (key) {
					console.log("key : ", key)
					if (self.hasOwnProperty(key)) {
				
					serializedObj[key] = self[key];

				}
			console.log("SERIALIZED")
			console.log(serializedObj)
			})
			return serializedObj;
			*/
		
	}
}

// DogProxy class to create a image of a dog object (created with the Dog class)
// The client.js will acess this image dog and not the "real" dog object created by the Dog class 
class DogProxy extends Dog {


	constructor(name) {
		console.log('This is dogProxy constructor');
		super(name);
	}

	// Overriding the newborn function, just to initialize class Dog properties.
	newBorn() {
		console.log('Overridding default');
	}

}


// Dog and DogProxy classes exports
module.exports = {
	Dog: Dog,
	DogProxy: DogProxy
}

