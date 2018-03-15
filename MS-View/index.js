/*
	*	index.js
	*
	*	Client requesting a new dog object 
*/

let dogFactory = require('../lib/dogFactory-client.js');

let event = "newDoc";

// Get server adress
dogFactory.setup('http://localhost:3000');

let idefix = dogFactory.push("Idefix", event = "newDoc");

let scoobyDoo = dogFactory.push("ScoobyDoo", event = "newDoc");

let ranTanPlan = dogFactory.push("RanTanPlan", event = "newDoc");


idefix.on('older', (/*dogImage*/) => {
	//console.log('Idefix is older, he is ' + dogImage.age);
	console.log('Idefix is older, he is ' + idefix.age);
	//console.log(idefix)

}) 
.on('deadDog', () => {
	console.log('OOOHHHHHHHHH NO ' + idefix._id + ' IS DEAD WHEN HE WAS ' + idefix.age)
})


