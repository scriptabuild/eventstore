# Eventstore
A simple filebased eventsourced store

## Installation

```bash
npm install @aeinbu/eventstore
```

## Usage
```javascript
// contactbook.js

function ContactBook(dispatch, registerEventhandlers){
	let contacts = {};

	registerEventhandlers({
		onContactAdded: {name, address, phone} => {
			contacts[name] = {name, address, phone};
		},
		onContactRemoved: {name} => {
			delete contacts[name];
		}
	});

	// commands
	this.addContact = (name, city, phone) =>{
		dispatch("contactAdded", {name, city, phone});
	};

	this.removeContact = name => {
		dispatch("contactRemoved", {name});
	};

	this.getContacts = name => contacts[name];
	this.getAllContacts = () => contacts;
}
```

```javascript
const initStore = require("@aeinbu/eventstore");
const ContactBook = require("./contactbook.js");
const folder = "/path/to/store";
const createFunc = (dispatch, registerEventhandlers, registerSnapshothandlers) => new ContactBook(dispatch, registerEventhandlers);

const store = initStore(folder, createFunc);


store.withRetries((instance, rollback) => {
	// do something with instance.
	instance.addContact({name: "peter", city: "oslo", phone: "11223344"});
	instance.addContact({name: "annie", city: "stockholm", phone: "44332211"});
}); // Everything is saved to log at end of block.


store.withRetries((instance, rollback) => {
	// do something with instance.
	instance.removeContact("peter");

	if(true) rollback();
}); // Nothing is saved to log because of rollback.
```
