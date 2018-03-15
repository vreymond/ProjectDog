let warehouseCall = require('../lib/dogWarehouse-client.js');
warehouseCall.setup('http://localhost:5000')

let family = 'Famous';

warehouseCall.fetchFamily(family).on('familyData', (familyObj) => {
	console.log('Family received from ' + family + ' family');
	console.log(familyObj);
})

warehouseCall.fetchTopo(family).on('topology', (topology) => {
	console.log('Topology received from ' + family + ' family');
	console.log(topology);
})

let familyToAdd = {
			"type": "family",
			"_id": "Famous",
			"nodes": [
				{
					"id": "Idefix"
				},
				{
					"id": "ScoobyDoo"
				}
			],
			"links": [
				{
					"source": "Idefix",
					"target": "ScoobyDoo"
				}
			]
		}

warehouseCall.push(familyToAdd).on('addResult', (result) => {
	console.log(result);
})
