# Eventstore
A simple filebased eventsourced store

## Installation

```bash
npm install @aeinbu/eventstore
```

## Usage

```javascript
// contactlist.js
function ContactList(dispatch, registerEventhandlers){

	let contacts = {};  // This is where the actual data is stored

	// These are the eventhandlers, that manipulate the data.
	registerEventhandlers({
		onContactAdded(event){
			if(!contacts[event.contact.name])
			{
				contacts[event.contact.name] = event.contact;
				return;
			}
			throw new Error("Contact already exists");
		},
		onContactRemoved(event){
			if(contacts[event.contactname])
			{
				delete contacts[event.contactname];
				return;
			}
			throw new Error("Contact doesnt exists");			
		}
	});

	// These are the command methods that are exposed to the developer using this class
	this.addContact = (contact) => {
		dispatch("contactAdded", {contact});
	};

	this.removeContact = (contactname) => {
		dispatch("contactRemoved", {contactname});
	};

	// This is a query method that is exposed to the developer using this class
	this.getAllContacts = () => {
		return Object.keys(contacts).map(key => contacts[key]);
	};
}
```

```javascript
// demo.js
const initStore = require("@aeinbu/eventstore");
const ContactBook = require("./contactlist.js");

const folder = "/path/to/store";
const createFunc = (dispatch, registerEventhandlers, registerSnapshothandlers) => new ContactList(dispatch, registerEventhandlers);
const store = initStore(folder, createFunc);

const assert = require("assert");
const path = require("path");
const initStore = require("../source/store.js");
const Contactlist = require("./ContactList");

const folder = path.resolve(__dirname, "../temp");

// TODO: remove folder before running tests

const createContactlistFn = (dispatch, reh, rsh) => new Contactlist(dispatch, reh);
let store = initStore(folder, createContactlistFn);

// TODO: check folder is created, but is empty

store.withRetries((contactlist, rollback) => {
	contactlist.addContact({name: "Mickey Mouse", city: "Duckburgh", species: "Mouse"});
	contactlist.addContact({name: "Goofey", city: "Duckburgh", species: "Dog"});
}); // Everything is saved to log at end of block.

store.withRetries((contactlist, rollback) => {
	contactlist.addContact({name: "Peter Pan", city: "Never Never Land", species: "Boy"});
	contactlist.removeContact("Goofey");
	rollback();
}); // Nothing is saved to log because of rollback.
```

_See the `tests/` folder for a more complete example, including support for snapshots_