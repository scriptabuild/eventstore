[< Back to frontpage](./index.md)

# modelDefinition

The `modelDefinition` object is created by you, to tell Eventstore how to initialize the _domain model_ and related artifacts.
---
modelDefinition: object
- snapshotName: string
- createLogAggregator(snapshot: any): any
- createDomainModel(dispatch: function, logAggregator: object)

---

Full (and commented) version:
```javascript
let modelDefinition = {

	// The snapshotName is optional. If none provided, snapshots are disabled for this model.
	snapshotName: "name-of-the-model",

	createLogAggregator(snapshot){
		// This method is used to instantiate the LogAggregator. This will usually be a constructor.
		// If snapsshots are enabled for this model, the method should accept the snapshot data object.
		// The snapshot data are deserialized from a json file.

		let aLogAggregatorInstance = new SomeLogAggregator(snapshot);
		return aLogAggregatorInstance;
	},

	createDomainModel(dispatch, logAggregator){
		let aDomainModel = new DomainModel(dispatch, logAggregator);
		return aDomainModel;
	},
}
```

Shorter alternate syntaxes for defining eventHandlers and initializing the required objects:
```javascript
let modelDefinition = {

	// Optional:
	snapshotName: "name-of-the-model",

	createLogAggregator: snapshot => new SomeLogAggregator(snapshot),

	createDomainModel: (dispatch, logAggregator) => new DomainModel(dispatch, logAggregator),
}
```
