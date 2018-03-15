/*
	*	index.js from MS-Warehouse
	*
	*	This file start the warehouse server
	*	We need to require the warehouse-server file that contain the start function

	### TO DO ###
	Switch in command line
	--file will load data inside a json file =>> DONE
	--couch='localhost:8000' can define a certain database adress
	#############
*/

const EventEmitter = require('events');
let warehouseServ = require('./warehouse-server');
let couchDB = require('./couchDB-interactions.js');
let nano = require('nano')('http://vreymond:couch@localhost:5984');
let program = require('commander');
let fs = require('fs');
let jsonfile = require('jsonfile');

let emitterDB = new EventEmitter();
let nameDB = 'warehouse'; 
let debug = false;
let fileDB = null;

/* 
	Command line management. -f or --file to build the DB from a json file.
	-d or --debug to start the debug mode.
*/
program
  .option('-f, --file <path>', 'Path to json file to to populate the couchDB')
  .option('-d, --debug', 'Debug mode on')
  .parse(process.argv);

if(program.file && program.file != "") fileDB = program.file;
if(program.debug) debug = true;
console.log(debug);
if(debug) warehouseServ.debugOn(); // If debug, calling debugOn function from warehouse-server.js

// couchDB creation. If db already exist, destroy it and recreate it.
nano.db.destroy(nameDB, function(err) {
	if (err && err.statusCode != 404){
		console.log('err')
		console.log(err)
		throw 'FAILED: Destroying ' + nameDB +' database' 
	}
	//console.log('SUCESS: Database destroyed')
	nano.db.create(nameDB, function(err) {
		if (err){
			console.log('err')
			console.log(err)
			throw 'FAILED: Creation of database';
		}
		console.log('SUCESS: Database ' + nameDB + ' created');
		let db = nano.use(nameDB);
		if (fileDB !== null){
			emitterDB.emit('created');
		}
	})
})

// if we want to build the db with a json file
emitterDB.on('created', () => {
	
	//if (process.argv.length > 2)
		//let file_arg = process.argv[2];
		let fileSize = fs.statSync(fileDB);
		if (fileSize.size < 1){
			throw 'Empty file given in args';
		}
		else{
			let dataFile = jsonfile.readFileSync(fileDB);
			if(dataFile.db){
				couchDB.addToDB(dataFile.db, nameDB);
			}
			else{
				throw 'FAILED: Format not accepted by the database'
			}
		}
	//}
})

// Starting warehouse server on port 5000
// TO DO: Add port option
warehouseServ.start();

// Waiting for some socket events.
warehouseServ.on('fetchDoc', (packet) => {
	couchDB.fetchDoc(packet.data()._id, nameDB).on('fetchDocDone', (docArray) => {
		packet.data(docArray);
		console.log(packet.data())
		if (packet.data()[0] === null){
			warehouseServ.push(fetch = 'docNotFound', packet = packet);
		}
		else {
			warehouseServ.push(fetch = 'docFound', packet = packet);
		}
	})
})
.on('addObj', (packet) => {
	couchDB.addToDB(packet.data(), nameDB).on('addSucceed', (ID) => {
		packet.data(ID);
		warehouseServ.push(fetch = 'addSucceed', packet = packet);
	})
	.on('addFailed', (err) => {
		packet.data(err);
		warehouseServ.push(fetch = 'addFailed', packet = packet);
	})
})
.on('fetchFamily', (packet) => {
	fetchFamily(packet.data(), nameDB).on('fetchFamilyDone', (dataDoc) => {
		packet.data(dataDoc);
		if (packet.data()[0] === null){
			warehouseServ.push(fetch = 'familyNotFound', packet = packet);
		}
		else {
			warehouseServ.push(fetch = 'familyFound', packet = packet);
		}
	})
})
.on('fetchTopology', (packet) => {
	fetchTopology(packet.data()).on('topologyOfFamily', (topologyJson) => {
		packet.data(topologyJson);
		if (packet.data()[0] === null){
			warehouseServ.push(fetch = 'topologyNotFound', packet = packet);
		}
		else {
			warehouseServ.push(fetch = 'topologyFound', packet = packet);
		}
	})
})

/*
	Function that return a doc which is a family of documents. It contains links/nodes 
	structures. We check that the document ID requested got the 'family' type.
*/
function fetchFamily(familyID, nameDB){
	let familyEmitter = new EventEmitter();
	nano.request({db: nameDB, method: 'POST', doc: '_find', body: {"selector": {"_id": familyID}}}, function(err,data){
		let dataSize = data.docs.length;

		switch (true){
			// case where data.docs.length is equal to 0 (no data found in DB)
			case dataSize === 0:
				console.log('FAILED: No match found for "' + familyID + '" ID');
				return data;
			break;
			// case where multiple id found in the DB (normally impossible, but we never know...)
			case dataSize > 1:
				throw ('WARNING: Too many document matched to the unique id');
			break;
			// else case (data.docs.length = 1)
			default:
				let dataType = data.docs[0].type;
				let dataDoc = data.docs[0];
				//console.log(dataDoc);
				if (dataType !== 'family'){
					console.log('Error, object has not the "family" type');
					return dataType;
				}
				familyEmitter.emit('fetchFamilyDone', dataDoc);
		}
	})
	return familyEmitter;
}

/*
	 Find the root of the pipeline tree.
*/
function findRoot (tree) {
	
	let sources = tree.links.map(element => element.source);
	let targets = tree.links.map(element => element.target);
	let treeRoot = tree.nodes.filter(val => {
		if (sources.includes(val.id) && !targets.includes(val.id)) {
			return true;
		}
		else {
			return false;
		}
	});
	return treeRoot;
}

/*
	Function that returned the topology of a doc family. This will returned an object that contains
	3 keys: nodes (array of nodes present in the family) / links (array of all links between nodes)
	and root (also an array of root(s) of the family)
*/
function fetchTopology(familyID){
	let topologyEmitter = new EventEmitter();
	let topologyJson = {};
	let listNoEmptyObjNodes = [];
	let listNoEmptyObjLinks = [];
    	
	fetchFamily(familyID, nameDB).on('fetchFamilyDone', (familyData) => {
		// check if nodes and if links
		let emptyNodes = emptyElementOfArrayCheck(familyData.nodes);
		let emptyLinks = emptyElementOfArrayCheck(familyData.links);
		console.log(familyData)
		switch (true){
			//check links and nodes
			case !familyData.hasOwnProperty('nodes') || !familyData.hasOwnProperty('links'):
				console.log('One key nodes or links is missing!!')
				
			// case where no nodes are present in familyData.nodes
			case familyData.nodes.length === 0:
				console.log('The ' + familyID + ' docs family has no nodes');
			break;
			// case where at least one of node or links in familyData.nodes is an empty object
			case emptyNodes.includes(true) || emptyLinks.includes(true):
				console.log('One or more nodes/links of ' + familyID + ' family are empty');
				listNoEmptyObjNodes = removeEmptyObj(familyData.nodes, emptyNodes);
				listNoEmptyObjLinks = removeEmptyObj(familyData.links, emptyLinks);
			break;

			default:
				console.log('Fetching ok')
				listNoEmptyObjNodes = familyData.nodes
				listNoEmptyObjLinks = familyData.links
		}
		topologyJson["nodes"] = listNoEmptyObjNodes;
		topologyJson["links"] = listNoEmptyObjLinks;		
		topologyJson["roots"] = findRoot(topologyJson);
		topologyEmitter.emit('topologyOfFamily', topologyJson);
	})
	return topologyEmitter;
}

/*
	Function that returned of array of booleans. True value of an element of an array means that we have 
	an empty object in the array we want to check at.
*/
function emptyElementOfArrayCheck(array){
	let checkList = array.map(obj => Object.keys(obj).length === 0 && obj.constructor === Object);
	console.log(checkList)
	return checkList;
}

function removeEmptyObj(listToRemove, checkList){
	let listNoEmptyObj = [];
	for (let element in checkList){
		if(checkList[element] !== true){
			listNoEmptyObj.push((listToRemove[element]))
		}
	}
	return listNoEmptyObj;	
}


