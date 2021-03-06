[< Back to frontpage](./index.md)

# defineStore

defineStore(folder: string, options: object) : _store_
- async ensureFolder()
- async log(eventObj)
- async logBlock(action)
- async replayEventStream(handleEvents)
- defineModel(modelDefinition: object) : _model_
	- async snapshot()
	- async withReadInstance(action(instance: domainModel))
	- async withReadWriteInstance(action(instance: domainModel, readyToCommit()), maxRetries: number)

---
## defineStore(folder, options)
When using `defineStore` with node.js, the file system is used as the persistence by default.

```javascript
const {defineStore} = require("@scriptabuild/eventstore");

let store = defineStore("/foldername");
```

You can supply a options object, to override the following settings:
- `createHeaders()` function returns extra optional headers to add to all log files and snapshot files.
- `fs` returns an object with methods to access the persistent store. As the name implies, the default is the file system.
	Only a few methods are required, as shown in the listing below.
- `console` returns an object used for writing console messages.
	Only a few methods are required, as shown in the listing below.

```javascript
const {defineStore} = require("@scriptabuild/eventstore");

let options = {
	createHeaders: (() => { /* custom implementation */ }),
	fs: {
		async mkdir(path, mode = 0o777){ /* custom implementation */ },
		async readdir(path, options){ /* custom implementation */ },
		async readFile(file, options){ /* custom implementation */ },
		async appendFile(file, data, options){ /* custom implementation */ }
	},
	console: {
		info(){ /* custom implementation */ },
		log(){ /* custom implementation */ },
		warn(){ /* custom implementation */ },
		error(){ /* custom implementation */ }
};

let store = defineStore("/foldername", options);
```

---
## async _store_.ensureFolder()
Ensures that the log folder exists, and creates it if it doesn't.

```javascript
const {defineStore} = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

store.ensureFolder();
```

NOTE: This function works recursivly, so it will create all missing folders from the root folder an up the folder for the store.

NOTE: This function is not yet completely implemented for Windows, and will throw an exception if it needs to create recursive folders.

---
## async _store_.log(eventObj)
Writes an event to the eventlog without defining a model. This is for all practical purposes the write-only mode.

```javascript
const {defineStore} = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

store.log({name: "some-event-name", data: { /* custom object */ }})
```

---
## async _store_.logBlock(action)
Writes an block of events to the eventlog without defining a model. This is for all practical purposes the write-only mode.

With logblock, the events are only written to the log when the block is marked as completed, by calling the `markAsComplete()` method. When this method is not called, the events are not persisted. This allows for all-or-nothing transactions.

```javascript
const {defineStore} = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

store.logBlock((log, markAsComplete) => {
	store.log({name: "some-event-name", data: { /* custom object */ }})
	store.log({name: "some-other-name", data: { /* custom object */ }})
	store.log({name: "some-event-name", data: { /* custom object */ }})
	markAsComplete();
});
```

---
## async _store_.replayEventStream(handleEvents)
Allows streaming (and reading) all event in the eventlog without defining a model.

```javascript
const {defineStore} = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

store.replayEventStream((event, headers) => {
	console.log(`event: ${event}, headers: ${headers}`);
});
```

---
## _store_.defineModel(modelDefinition)
Returns an object used to access the _domain model_.

This object exposes the following methods:
- `snapshot`
- `getAggregatorData`
- `withReadModel`
- `withReadWriteModel`

These methods are described further below in the documentation.

```javascript
const {defineStore} = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

let model = store.defineModel(modelDefinition);
```

`modelDefinition` is an object with the following properties and functions:
- snapshotName: string
- createLogAggregator(snapshot: any): any
- createDomainModel(dispatch: function, logAggregator: object)


```javascript
const {defineStore} = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

let modelDefinition = {
	snapshotName: "some-model-name",
	initializeLogAggregatorData: () => ({});
	createLogAggregator: logAggregatorData => new MyCustomLogAggregator(logAggregatorData),
	createDomainModel: (dispatch, logAggregatorData) => new MyCustomDomainModel(dispatch, logAggregatorData)
}

let model = store.defineModel(modelDefinition);
```

---
## async _model_.snapshot()
Saves a snapshot of the current state

```javascript
//TODO:
```

---
## async _model_.getAggregatorData()
Returns a readonly instance of the data in the aggregator. Atempts to change the model inside here will not store the events back to the aggregator nor eventstore.

A domain model is not needed for this.

```javascript
//TODO:
```

---
## async _model_.withReadInstance(action)
Creates a readonly instance of the model. Atempts to change the model inside here will not change the model nor store the events back to the eventstore.

```javascript
//TODO:
```

---
## async _model_.withReadWriteInstance(action, maxRetries)
Creates a read/write instance of the model. Any events fired on the model inside here will be stored to the eventstore.

```javascript
//TODO:
```
