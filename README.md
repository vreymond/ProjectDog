# Multiple micro-services connection using Socket.io

## Description

4 micro-services:
	- MS-View: requesting the creation of new dogs.
	- MS-Park: this is the dog factory, will create dogs. Looks if dog is already alive or check if he died into the MS-Warehouse.
	- MS-Warehouse: database factory, will request the database to get some information on dead dogs.
	- MS-FamilyView: can add a family into the database. Can retrieve a family or a topology

## Install

npm install into all micro-services and lib directory

## Run

Run MS-Park and MS-Warehouse in two different terminal with the following command:
	
```
	node index.js
```

Then, into another terminal start the MS-View with the same command as before.
You will see appear 3 living dogs. They will be older every 2sec (+1 in age) and have a certain probability to die.
If so, the dog will be strore into the warehouse database. If another client (MS-View) is started and requesting 
the creation of dogs, and a dog is already dead (like Idefix), it will be resurect and the client wille get the information 
concerning that particular dog (Idefix)
