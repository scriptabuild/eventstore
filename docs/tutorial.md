# Getting started with EventStore
To start using EventStore, you will need to create 3 things:
- The _domain model_ class
- The _storage model_ class
- The _model definition_ object

In this tutorial, we'll create seperate artifacts for each these three things.

## The project
In this tutorial we're creating a small membership database. The main functionality will be to register members, change their details etc.

## The _Domain Model_
The _domain model_ has the methods on it to "do the business". The functionality available to the user of the eventstore is represented on the _domain model_.

When the _domain model_ needs to persist data, it does so by calling `dispatch(eventName, eventData)` to write an event to the event log.

When the _domain model_ needs to retrieve data, it gets it from the _storage model_. The _storage model_ uses the event log the recreate the data model when it is needed.

---
MemberListDomainModel: class
- constructor(dispatch: function, storeModel: any)
	- dispatch(eventName: string, eventData: any))
- doSomething(...)
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

## The _Storage Model_
Everytime data is persisted, it is written to the event log. Its hard to use data from the eventlog directly, so the _storage model_ is used to replay the events from the event log to build a more comprehensible data model.

The user of the eventstore will not see the _storage model_ directly, but will instead interact with the _domain model_.

Code in the _storage model_ must not do external integrations, as the event handlers on the _storage model_ will be called for each event each time the log is played back. External integrations (like sending email in this case) should happen in the _domain model_.
---
MemberListStoreModel: class
- constructor(snapshotData: any)
- createSnapshotData(): any
- this.eventHandlers: object
	- onSomethingHappened(eventdata: any)
- this.members: object
---
```javascript
function MemberListStoreModel(snapshotData) {
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
The _model definition_ object tells @aeinbu/eventstore how to initialize the different models.
---
modelDefinition: object
- snapshotConfiguration: object
	- snapshotName: string
	- createSnapshotData() : object
- getEventHandlers(storeModel: object): object
- createStoreModel(snapshotData: any): any
- createDomainModel(dispatch: function, storeModel: object)
---
```javascript
let modelDefinition = {
	snapshotConfiguration: {
		snapshotName: "some-model",
		createSnapshotData: storeModel => storeModel.createSnapshotData()
	},
	getEventHandlers: storeModel => storeModel.eventHandlers,
	createStoreModel: snapshotData => new MemberListStoreModel(snapshotData),
	createDomainModel: (dispatch, storeModel) => new MemberListDomainModel(dispatch, storeModel)
}
```

# How to...???

defineStore(folder: string, options: object)
- defineModel(modelDefinition: object)
	- snapshot()
	- withReadInstance(action(instance: domainModel))
	- withReadWriteInstance(action(instance: domainModel, readyToCommit()), maxRetries: number)



dispatching
- method is called on domainModel
- domainModel dispatches by
	- store in eventStore
	- handle in storeModel (eventHandlers)
