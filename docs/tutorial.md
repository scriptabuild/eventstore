# Getting started with EventStore
To start using EventStore, you will first need to create 3 things:
- The _domain model_ class
- The _log aggregator_ class
- The _model definition_ object

In this tutorial, we'll create seperate artifacts for each these three things.

## The project
In this tutorial we're creating a small membership database. The main functionality will be to register members, change their details etc.

## The _Domain Model_
The _domain model_ has the methods on it to "do the business". The functionality available to the user of the eventstore is represented on the _domain model_.

When the _domain model_ needs to persist data, it does so by calling `dispatch(eventName, eventData)` to write an event to the event log.

When the _domain model_ needs to retrieve data, it gets it from the _storage model_. The _storage model_ uses the event log the recreate the data model when it is needed.

The following are the methods and properties on the _domain model_ for our membership database:
---
MemberListDomainModel: class
- constructor(dispatch: function, storeModel: any)
	- dispatch(eventName: string, eventData: any))
- registerNewMember(member: object)
- endMembership(name: string)
- correctAddress(name: string, address: object)
- memberHasMoved(name: string, address; object)
- listMembers(): array
- getMember(name: string): object

---
```javascript
function MemberListDomainModel(dispatch, storeModel) {
	this.registerNewMember = function(member) {
		dispatch("newMemberRegistered", { member });
		console.log("SEND MAIL -> welcome to new member");
	}

	this.endMembership = function(name) {
		dispatch("membershipEnded", { name });
		console.log("SEND MAIL -> goodbye to member");
	}

	this.correctAddress = function(name, address) {
		dispatch("addressCorrected", { name, address });
	}

	this.memberHasMoved = function(name, address) {
		dispatch("memberHasMoved", { name, address });
	}

	this.listMembers = function() {
		let members = storeModel.members;
		let ret = Object.keys(members).map(key => Object.assign({ name: key }, members[key]));
		return ret;
	}

	this.getMember = function(name) {
		return storeModel[name];
	}
}
```

## The _Log Aggregator_
Everytime data is persisted, it is written to the event log. Its hard to use data from the eventlog directly, so the _log aggregator_ is used to replay the events from the event log to build a more comprehensible data model. See [the Patterns page](./patterns.md) for a description of different patterns for building a model from a log.

The user of the eventstore will not see the _log aggregator_ directly, but will instead interact with the _domain model_.

Code in the _log aggregator_ must __not__ do external integrations, as the event handlers on the _log aggregator_ will be called for each event each time the log is played back. External integrations (like sending email in this case) should happen in the _domain model_.

The following are the methods and properties on the _log aggregator_ for our membership database:
---
MemberListLogAggregator: class
- constructor(snapshotData: any)
- createSnapshotData(): any
- this.eventHandlers: object
	- onNewMemberRegistered(eventdata: object)
	- onMembershipEnded(eventdata: object)
	- onAddressCorrected(eventdata: object)
	- onMemberHasMoved(eventdata: object)
- this.members: object

---
```javascript
function MemberListLogAggregator(snapshotData) {
	this.members = snapshotData || {};	// This is where the model is materialized!

	this.createSnapshotData = () => members;	// This is the method used to serialize to a snapshot. This method is the inverse of the above assignment of snapshotData

	this.eventHandlers = {
		onNewMemberRegistered(eventdata) {
			if (members[eventdata.member.name]) {
				throw new Error(`onNewMemberRegistered failed. ${eventdata.member.name} is already a member.`)
			}
			members[eventdata.member.name] = {
				address: eventdata.member.address,
				membershipLevel: eventdata.member.membershipLevel
			};
		},

		onMembershipEnded(eventdata) {
			if (!members[eventdata.name]) {
				throw new Error(`onMembershipEnded failed. ${eventdata.name} is not a member.`)
			}
			delete members[eventdata.name];
		},

		onAddressCorrected(eventdata) {
			if (!members[eventdata.name]) {
				throw new Error(`onAddressCorrected failed. ${eventdata.name} is not a member.`)
			}
			members[eventdata.name].address = eventdata.address;
		},

		onMemberHasMoved(eventdata) {
			if (!members[eventdata.name]) {
				throw new Error(`onMemberHasMoved failed. ${eventdata.name} is not a member.`)
			}
			members[eventdata.name].address = eventdata.address;
		}
	}
}
```

## The _model definition_
The _model definition_ object tells @scriptabuild/eventstore how to initialize the _domain model_ and the _log aggregator_.

The following are the methods and properties on the _model definition_:
---
modelDefinition: object
- snapshotConfiguration: object
	- snapshotName: string
	- createSnapshotData() : object
- getEventHandlers(storeModel: object): object
- createLogAggregator(snapshotData: any): any
- createDomainModel(dispatch: function, storeModel: object)

---
```javascript
let modelDefinition = {
	snapshotConfiguration: {
		snapshotName: "some-model",
		createSnapshotData: storeModel => storeModel.createSnapshotData()
	},
	getEventHandlers: storeModel => storeModel.eventHandlers,
	createLogAggregator: snapshotData => new MemberListLogAggregator(snapshotData),
	createDomainModel: (dispatch, storeModel) => new MemberListDomainModel(dispatch, storeModel)
}
```

## Putting the parts together

---
defineStore(folder: string, options: object)
- defineModel(modelDefinition: object)
	- snapshot()
	- withReadInstance(action(instance: domainModel))
	- withReadWriteInstance(action(instance: domainModel, readyToCommit()), maxRetries: number)

---
```javascript
const defineStore = require("../source/defineStore");

// Point at the physical data store. For node.js this will usually be a folder on the file system
let store = defineStore("/foldername");
let model = store.defineModel(modelDefinition);

await model.withReadWriteInstance((instance, readyToCommit) => {
	instance.registerNewMember({ name: "arjan einbu", address: {} });
	readyToCommit();
});
```

dispatching
- method is called on domainModel
- domainModel dispatches by
	- store in eventStore
	- handle in storeModel (eventHandlers)
