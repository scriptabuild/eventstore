# Eventstore
A simple filebased eventsourced data store for node.js.

Instead of storing the current state of our data, eventsourcing lets us record our intention while creating/manipulating our data.

## Installation

```bash
npm install @aeinbu/eventstore
```

## Example

Example of an object to be stored with this eventstore:

```javascript
// contactlist.js
function ContactList(dispatch, configureStore){

	let contacts = {};  // This is where the actual data is stored

	// These are the eventhandlers, that manipulate the data.
	configureStore({
		eventhandlers:{
			onContactAdded(eventdata){
				if(!contacts[eventdata.contact.name])
				{
					contacts[eventdata.contact.name] = eventdata.contact;
					return;
				}
				throw new Error("Contact already exists");
			},
			onContactRemoved(eventdata){
				if(contacts[eventdata.contactname])
				{
					delete contacts[eventdata.contactname];
					return;
				}
				throw new Error("Contact doesnt exist");			
			}
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

Usage of `contactlist` with the eventstore:

```javascript
// demo.js
const defineStore = require("@aeinbu/eventstore");
const Contactlist = require("./ContactList");

(async funtion(){
	const folder = "path/to/store";
	const createContactlistFn = (dispatch, configureStore) => new Contactlist(dispatch, configureStore);
	let store = await defineStore(folder);
	let rw = store.defineReadWriteModel("rw", createContactlistFn);

	rw.withRetries((contactlist, readyToCommit) => {
		contactlist.addContact({name: "Mickey Mouse", city: "Duckburgh", species: "Mouse"});
		contactlist.addContact({name: "Goofey", city: "Duckburgh", species: "Dog"});

		readyToCommit();
	}); // Everything is saved to log at end of block.


	rw.withRetries((contactlist, readyToCommit) => {
		contactlist.addContact({name: "Peter Pan", city: "Never Never Land", species: "Boy"});
		contactlist.removeContact("Goofey");
	}); // Nothing is saved to log. This unit of work was rolled back because no call was made to readyToCommit().
})();
```

_See the `tests/` folder for a more complete example, including support for snapshots, multiple models, including read-only models_

## Documentation

- `let storeBase = defineStore(folder)` - Sets up a folder as a database. Is the base for creating models on that folder.

- `storeBase.defineReadModel(action)` - 

- `storeBase.defineWriteModel(action)` - 

- `storeBase.defineReadWriteModel(action, commitCallback)` - 
