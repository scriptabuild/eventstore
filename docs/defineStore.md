[< Back to frontpage](./index.md)

# defineStore

---
defineStore(folder: string, options: object)
- defineModel(modelDefinition: object)
	- async snapshot()
	- async withReadInstance(action(instance: domainModel))
	- async withReadWriteInstance(action(instance: domainModel, readyToCommit()), maxRetries: number)
- async log(eventObj)
- async logBlock(action) {
- async replayEventStream(handleEvents){

---
## defineStore(folder, options)
When using `defineStore` with node.js, the file system is used as the persistence by default.

```javascript
const defineStore = require("@scriptabuild/eventstore");

let store = defineStore("/foldername");
```

You can supply a options object, to override the following settings:
- `createHeaders()` returns extra optional headers to add to all log files and snapshot files.
- `fs` returns an object to access the persistent store. As the name implies, the default is the file system.
	Only a few methods are required, as shown in the listing below.
- `console` returns an object used for writing console messages.
	Only a few methods are required, as shown in the listing below.

```javascript
const defineStore = require("@scriptabuild/eventstore");

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

## async _store_.log(eventObj)
Writes an event to the eventlog without defining a model. This is for all practical purposes the write-only mode.

```javascript
const defineStore = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

store.log({name: "some-event-name", data: { /* custom object */ }})
```

## async _store_.logBlock(action)
Writes an block of events to the eventlog without defining a model. This is for all practical purposes the write-only mode.

With logblock, the events are only written to the log when the block is marked as completed, by calling the `markAsComplete()` method. When this method is not called, the events are not persisted. This allows for all-or-nothing transactions.

```javascript
const defineStore = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

store.logBlock((log, markAsComplete) => {
	store.log({name: "some-event-name", data: { /* custom object */ }})
	store.log({name: "some-other-name", data: { /* custom object */ }})
	store.log({name: "some-event-name", data: { /* custom object */ }})
	markAsComplete();
});
```

## async _store_.replayEventStream(handleEvents)
Allows streaming (and reading) all event in the eventlog without defining a model.

```javascript
const defineStore = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

store.replayEventStream((event, headers) => {
	console.log(`event: ${event}, headers: ${headers}`);
});
```

## _store_.defineModel(modelDefinition)
Returns an object used to access the _domain model_.

This object exposes the following methods:
- `snapshot`
- `withReadModel`
- `withReadWriteModel`

These methods are described further below in the documentation.

```javascript
const defineStore = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

let model = store.defineModel(modelDefinition);
```

`modelDefinition` is an object with the following properties and functions:
- snapshotConfiguration: object
	- snapshotName: string
	- createSnapshotData() : object
- getEventHandlers(logAggregator: object): object
- createLogAggregator(snapshotData: any): any
- createDomainModel(dispatch: function, logAggregator: object)

---
```javascript
const defineStore = require("@scriptabuild/eventstore");
let store = defineStore("/foldername");

let modelDefinition = {
	snapshotConfiguration: {
		snapshotName: "some-model-name",
		createSnapshotData: logAggregator => logAggregator.createSnapshotData()
	},
	getEventHandlers: logAggregator => logAggregator.eventHandlers,
	createLogAggregator: snapshotData => new MyCustomLogAggregator(snapshotData),
	createDomainModel: (dispatch, logAggregator) => new MyCustomDomainModel(dispatch, logAggregator)
}

let model = store.defineModel(modelDefinition);
```

## async _model_.snapshot()
Saves a snapshot of the current state

```javascript
//TODO:
```

## async _model_.withReadInstance(action)
Creates a read instance of the model. Atempts to change the model inside here will not store the events to the eventstore.

```javascript
//TODO:
```

## async _model_.withReadWriteInstance(action, maxRetries)
Creates a read/write instance of the model. Any events fired on the model inside here will be stored to the eventstore.

```javascript
//TODO:
```
