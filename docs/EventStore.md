
# EventStore class

This class represents the actual underlying eventstore, and has three responsibilities:
- writing events to the log
- replaying the log
- handling snapshots

## new EventStore(folder, options);
|parameters| |
|-|-|
|`folder`|Root folder for log files|
|`options`|Options for adjusting the bahaviour of the EventStore|

### options
|property|purpose|default value|
|-|-|-|
|`console`|Used for logging|The native `console` object.|
|`fs`|Used for persisting the events|An object representing an awaitable subset of nodejs' `fs` file system api. (See `/test/FakeAwaitableFs.js` to see what methods are needed to use an alternative storage.)|
|`createHeaders`|Used to define headers when persisting logs|Writes the `time` header|

``` javascript
let evs = new EventStore("somefolder");
```

``` javascript
// example with options
let options = {
	console: {
		log(...obj){ /* do nothing? */ }
	},
	fs: {
		mkdir(path, mode){ /* your custom implementation? */ },
		readdir(path, options){ /* your custom implementation? */ },
		readfile(file, options){ /* your custom implementation? */ },
		appendfile(file, data, options){ /* your custom implementation? */}
	}
	createHeaders(){
		return {
			time: new Date().toISOString(),
			myCustomHeader: "some value?"
		};
	}
};

let evs = new EventStore("somefolder", options);
```

## getLatestFileNo(files, ext)

//TODO:

## getAllFilenames(folder)

//TODO:

## getLatestSnapshotFileNo(snapshotName)

//TODO:

## restoreSnapshot(snapshotFileNo, snapshotName)

//TODO:

## saveSnapshot(snapshot, modelName, fileNo)

//TODO:

## getLatestLogFileNo()

//TODO:

## async .log(eventObj [,fileNo])

|parameters| |
|-|-|
|`eventObj`|Event to store to the eventstore|
|`fileNo`|Optional. The number for the log file. This operation fails if that log file already exists|

``` javascript
let evs = new EventStore("somefolder");

await evs.log({name: "first event", data: "some event data"});
```

``` javascript
// example with fileNo parameter
let evs = new EventStore("somefolder");
let fileNo = 4;

await evs.log({name: "first event", data: "some event data"}, fileNo);
```

## async .logBlock(action [,fileNo])

This method batches multiple event entries into the same file.

|parameters| |
|-|-|
|`action`|Function that receives a `log(...)` method and a `markAsComplete()` method|
|`fileNo`|Optional. The number for the log file. This operation fails if that log file already exists|

``` javascript
let evs = new EventStore("somefolder");

await evs.logBlock((log, markAsComplete) => {
	log( {name: "first event", data: "some event data"} );
	log( {name: "second event", data: { a: 10, b: 20 }} );
	markAsComplete();
});
```

``` javascript
// example with fileNo parameter
let evs = new EventStore("somefolder");
let fileNo = 4;

await evs.logBlock((log, markAsComplete) => {
	log( {name: "first event", data: "some event data"} );
	log( {name: "second event", data: { a: 10, b: 20 }} );
	markAsComplete();
}, fileNo);
```

## async replayEventStream(handleEvent [,fileRange [,stopReplayPredicates]])

|parameters| |
|-|-|
|`handleEvent`|Function that receives a `(event)` object|
|`fileRange`|Optional. Object with `from` and `to` for specifying a range of logfiles to replay. This is usefull when speeding up the restore of a model by using snapshots.|
|stopReplayPredicates|Optional. Object with function for `beforeApply` and `afterApply` predicates for stopping the replay|

``` javascript
let evs = new EventStore("somefolder");

await evs.replayEventStream((event, headers) => {
	// do something with the events...
	console.log(headers, event);
})
```

``` javascript
// example with fileRange and stopReplayPredicates parameters
let evs = new EventStore("somefolder");
let fileRange = {from: 4, to: 10};
let stopReplayPredicates = {
	stopeBeforeApply(contents, fileNo, filename){
		// custom code to stop replaying the log before applying
		return false;
	},
	stopAfterApply(contents, fileNo, filename){
		// custom code to stop replaying the log after applying
		return false;
	}
};

await evs.replayEventStream((event, headers) => {
	// do something with the events...
	console.log(headers, event);
}, fileRange, stopReplayPredicates)
```

## saveEvents(events, fileNo)

//TODO:
