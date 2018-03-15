// warehouse DB

/*
	*	warehouse.js
	*
	*	This file is the warehouse manage. If a dead dog is received from a client
	*	we add it to the warehouse "database". Curently the database is just a json file
	*	that contin one key "db" and got an array of dog objects
	
*/

// Initialize the warehouseDB database
let warehouseDB = {'db': []};
const EventEmitter = require('events');

/*
	TO DO: chech in addDog if a dog already exist in the warehouseDB,
*/
console.log(warehouseDB);
let addDog = function (dogObj){
	console.log('\nAdding ' + dogObj.name + ' to the warehouse');
	//Old version of the warehousDB json: warehouseDB[dogObj.name] = dogObj;
	warehouseDB['db'].push(dogObj)
	console.log('COMPLETE');
	console.log('warehouseDB is now updated:');
	console.dir(warehouseDB);
}

// Function that search inside the warehouseDB if it exist. Accept a dog name.
let fetchDog = function (dogName){
	console.log('Attempt to check if ' + dogName + ' exist in the warehouseDB');

	for (let element of warehouseDB.db){
		if (element.name === dogName){
			console.log('§§§§ DOG FOUND IN WAREHOUSE §§§§')
			console.dir(element);
			return element;
		}
	}
	return {};

	/* Find version
		warehouseDB.db.find(function(element) {
			console.log("element : ")
			console.log(element)
			if (element.name === dogName){
				console.log('§§§§ DOG FOUND IN WAREHOUSE §§§§')
				console.dir(element);
				emitter.emit('dogFound', element);
			}
		});
	*/
	/* Try catch to break a forEach loop
		setTimeout(function(){
			var BreakException = {};

			try {
  				warehouseDB.db.forEach(function(element) {
    				console.log(element);
    				if (element.name === dogName){
    					console.log('§§§§ DOG FOUND IN WAREHOUSE §§§§')
						console.dir(element);
						emitter.emit('dogFound', element);
    					throw BreakException;
  					}
  				})
  			} catch (e) {
  				if (e !== BreakException) throw e;
			}
		},10)
	*/
}

module.exports = {
	addDog: addDog,
	fetchDog: fetchDog,
}