//
// Model for replaying event to find what event types/names/params/payloads in a log
// Should record version info
// - first occurrence date
// - when params/payload change shape
// - other version information
//

// TODO: registerFallbackEventhandler
function EventAnalyzer(dispatch, configureStore){
	let eventTypes = {
		// "<eventname>": [{
		// 	"<firstdate>": "...",
		// 	"<version>": "...",
		// 	count: 0,
		// 	params: ["name", "address", ]
		// }]
	};


	let storeConfig = {
		createSnapshotData(){
			return eventTypes;
		},
		restoreFromSnapshot(snapshotContents){
			eventTypes = snapshotContents;
		},
		eventhandlers:{
			// No pre-known eventhandlers, since we're analyzing a log of unknown events.
		},
		fallbackEventHandler(eventname, eventdata){
			if(!eventTypes[eventname]){
				eventTypes[eventname] = {};
			}

			eventTypes[eventname].params = {};
			// TODO: get structure incl dept and type

		},
	}
	configureStore(storeConfig);



	this.listEventTypes = function(){
		return this.eventTypes
	}
}

module.exports = EventAnalyzer;
