[< Back to frontpage](./index.md)

# modelDefinition

The `modelDefinition` object is created by you, to tell Eventstore how to initialize the _domain model_ and related artifacts.
---
modelDefinition: object
- snapshotConfiguration: object
	- snapshotName: string
	- createSnapshotData() : object
- getEventHandlers(logAggregator: object): object
	- on_EventName_(eventData: object, headers: object)
- createLogAggregator(snapshotData: any): any
- createDomainModel(dispatch: function, logAggregator: object)
- fallbackEventHandler(eventName: string, eventData: object, headers: object)

---

Full (and commented) version:
```javascript
let modelDefinition = {

	// The snapshot configuration is optional. If none provided, snapshots are disabled for this model.
	snapshotConfiguration: {
		snapshotName: "name-of-the-model",
		createSnapshotData() {
			// This method should return a serializable snapshot object.
			//   (Ie. An object with only value properties, no methods and no circular references)
		}
	},

	getEventHandlers(logAggregator){
		return {
			onSomeEvent(eventData, headers){
				// Handle the event, and modify the internal state of the log aggregator object accordingly.
			},
			onSomeOtherEvent(eventData, headers){
				// Handle the event, and modify the internal state of the log aggregator object accordingly.
			}
		};
	},

	createLogAggregator(snapshotData){
		// This method is used to instantiate the LogAggregator. This will usually be a constructor.
		// If snapsshots are enabled for this model, the method should accept the snapshot data object.
		// The snapshot data are deserialized from a json file.

		let aLogAggregatorInstance = new SomeLogAggregator(snapshotData);
		return aLogAggregatorInstance;
	},

	createDomainModel(dispatch, logAggregator){
		let aDomainModel = new DomainModel(dispatch, logAggregator);
		return aDomainModel;
	},

	// Events that aren't handled by the event handlers from getEventHandlers(...), will be handled by the fallback event handler.
	// The fallback event handler is optional. If none provided, unknown events will be ignored by this model.
	fallbackEventHandler(eventName, eventData, headers){
		// Handle the event, and modify the internal state of the log aggregator object accordingly.
	}
}
```

Shorter alternate syntaxes for defining eventHandlers and initializing the required objects:
```javascript
let modelDefinition = {

	// Optional:
	snapshotConfiguration: {
		snapshotName: "name-of-the-model",
		createSnapshotData: logAggregator => logAggregator.createSnapshotData()
	},

	getEventHandlers: logAggregator => logAggregator.eventHandlers,
	
	createLogAggregator: snapshotData => new SomeLogAggregator(snapshotData),

	createDomainModel: (dispatch, logAggregator) => new DomainModel(dispatch, logAggregator),

	// Optional:
	fallbackEventHandler: (eventName, eventData, headers) => { /* Handle event...*/ }
}
```
