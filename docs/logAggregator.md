[< Back to frontpage](./index.md)

## The _Log Aggregator_
Everytime data is persisted, it is written to the event log. Its hard to use data from the eventlog directly, so the _log aggregator_ is used to replay the events from the event log to build a more comprehensible data model. See [the Patterns page](./patterns.md) for a description of different patterns for building a model from a log.

The user of the eventstore will not see the _log aggregator_ directly, but will instead interact with the _domain model_.

Code in the _log aggregator_ must __not__ do external integrations, as the event handlers on the _log aggregator_ will be called for each event each time the log is played back. External integrations (like sending email in this case) should happen in the _domain model_.

The following are the methods and properties on the _log aggregator_:

---
LogAggregator: class
- constructor(logAggregatorData: any)
- this.eventHandlers: object
	- on_Event1_(eventdata: object, headers: object)
	- on_Event2_(eventdata: object, headers: object)
	- on_Event3_(eventdata: object, headers: object)
- this.fallbackEventHandler(eventname: string, eventdata: object, headers: object)
---
```javascript
const wrapInReadOnlyProxy = require("@scriptabuild/readonlyproxy")

function LogAggregator(logAggregatorData) {

	this.eventHandlers = {
		onEvent1(eventdata, headers) {
			//...manipulate logAggregatorData
		},

		onEvent2(eventdata, headers) {
			//...manipulate logAggregatorData
		},

		onEvent3(eventdata, headers) {
			//...manipulate logAggregatorData
		}
	};

	this.fallbackEventHandler(eventname, eventdata, headers){
		//...manipulate logAggregatorData
	}
}
```
