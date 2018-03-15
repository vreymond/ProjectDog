const EventEmitter = require('events');
let nano = require('nano')('http://vreymond:couch@localhost:5984');

/*
	Function that add a doc or a list of doc to couchDB warehouse database.
*/
function addToDB (data, nameDB) {
	let addEmitter = new EventEmitter();
	let db = nano.use(nameDB);
	let docList = [];
	// Test is data is a list
	if(Array.isArray(data)){
		docList = data;
	}
	else{
		docList.push(data);
	}

	for (let i of docList){
		console.log('Adding:')
		console.log(i)
		db.insert(i, function(err, body) {
           	if (err) {
               	console.log('FAILED: Insertion from file in database ', err.message);
               	addEmitter.emit('addFailed', err);
                return;
            }
        console.log('SUCESS: Insertion from file in ' + nameDB + ' database of ' + i._id);
        addEmitter.emit('addSucceed', 'SUCESS: Insertion from file in ' + nameDB + ' database of ' + i._id);
        });
	}
	return addEmitter;
}

/*
	Function that fetch a document. Data given can be an ID or a list of IDs
*/
function fetchDoc(data, nameDB){
	let docEmitter = new EventEmitter();
	let listID = [];
	let counter = 0;
	
	if(!data || data.length === 0){
		throw ('FAILED: No data given in args')
	}
	if(Array.isArray(data)){
		listID = data;
	}
	else {
		listID.push(data);
	}
	// listID length before request
	let listLengthStart = listID.length;
	
	// Requesting couchDB for each element in listID
	listID.forEach(function(element, i, array){
		nano.request({db: nameDB, method: 'POST', doc: '_find', body: {"selector": {"_id": element}}}, function(err,data){
			if (!err){
				let dataSize = data.docs.length;
				let dataDoc = data.docs[0];
				// check if request is empty (data.docs = [])
				if(dataSize === 0){
					console.log('FAILED: No dogs found in DB with the "' + element + '" ID');
					listID[i] = null;
				}
				else {
					// If doc found, we replace the ID in listID list by the document returned by couchDB
					listID[i] = dataDoc;	
				}
			}
			// Case where the request cannot be happend (server down?)
			else{
				throw ('FAILED: Cannot proceed request for the "' + element + '" ID: ' + err)
			}
			counter += 1;

			if (counter === listLengthStart){
				if (listID.length !== counter){
					console.log('FAILED: A request failed')
				}
				docEmitter.emit('fetchDocDone', listID);
			};
		})
	})
	return docEmitter;

}

module.exports = {
	addToDB: addToDB,
	fetchDoc: fetchDoc,
}


