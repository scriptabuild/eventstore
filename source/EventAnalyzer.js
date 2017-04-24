//
// Model for replaying event to find what event types/names/params/payloads in a log
// Should record version info
// - first occurrence date
// - when params/payload change shape
// - other version information
//

// TODO: registerFallbackEventhandler
function EventAnalyzer(dispatch, configureStore) {
	let eventTypes = {
		// "<eventname>": [{
		// 	"<firstdate>": "...",
		// 	"<version>": "...",
		// 	count: 0,
		// 	params: ["name", "address", ]
		// }]
	};

	configureStore({
		createSnapshotData() {
			return eventTypes;
		},
		restoreFromSnapshot(snapshotContents) {
			eventTypes = snapshotContents;
		},
		eventhandlers: {
			// No pre-known eventhandlers, since we're analyzing a log of unknown events.
		},
		fallbackEventhandler(eventname, eventdata) {
			if (!eventTypes[eventname]) {
				eventTypes[eventname] = {
					count: 0
				};
			}

			// TODO:
			// 1. create structure description object (names and types, incl describing contents of arrays and objects)
			//    - add version info if any
			// 2. compare stored with new. If different -> add new (include firstdate)
			eventTypes[eventname].description = describe(eventdata);
			eventTypes[eventname].count++;
		}
	});

	function describe(obj) {
		let description = {};
		Object.keys(obj).forEach(prop => {
			description[prop] = typeof obj[prop] === "object" ? describe(obj[prop]) : typeof obj[prop];
		});
		return description;
	}


	this.listEventTypes = function () {
		return eventTypes
	}
}

module.exports = EventAnalyzer;