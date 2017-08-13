[< Back to frontpage](./index.md)

# modelDefinition

The `modelDefinition` object is created by you, to tell Eventstore how to initialize the _domain model_ and related artifacts.
---
modelDefinition: object
- snapshotName: string
- initializeLogAggregatorData(): object
- createLogAggregator(logAggregatorData: object): object
- createDomainModel(dispatch: function, logAggregatorData: object)

---

Full (and commented) version:
```javascript
let modelDefinition = {

	// The snapshotName is optional. If none provided, snapshots are disabled for this model.
	snapshotName: "name-of-the-model",

	initializeLogAggregatorData(){
		return {};
	},

	createLogAggregator(logAggregatorData){
		// This method is used to instantiate the LogAggregator. This will usually be a constructor.
		// The logAggregator must will manipulate the incomming logAggregatorData object.

		let aLogAggregatorInstance = new SomeLogAggregator(logAggregatorData);
		return aLogAggregatorInstance;
	},

	createDomainModel(dispatch, logAggregatorData){
		let aDomainModel = new DomainModel(dispatch, logAggregatorData);
		return aDomainModel;
	},
}
```

Shorter alternate syntaxes for defining eventHandlers and initializing the required objects:
```javascript
let modelDefinition = {

	// Optional:
	snapshotName: "name-of-the-model",

	initializeLogAggregatorData: () => ({}),

	createLogAggregator: logAggregatorData => new SomeLogAggregator(logAggregatorData),

	createDomainModel: (dispatch, logAggregatorData) => new DomainModel(dispatch, logAggregatorData),
}
```
