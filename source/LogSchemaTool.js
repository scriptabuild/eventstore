//
// Tool to determine the logged events schema
// This tool is made like a readOnlyModel for replaying event to find what event types/names/params/payloads in a log
// Should record version info
// - first (and last?) occurrence date
// - when params/payload change shape
// - other version information
//

function LogSchemaTool(dispatch, configureStore) {
	let eventTypes = {};

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
		fallbackEventhandler(eventname, eventdata, metadata) {
			if (!eventTypes[eventname]) {
				eventTypes[eventname] = {};
			}

			let description = describe(eventdata);

			let key = JSON.stringify(description);
			let version = eventTypes[eventname][key];
			if(!version){
				eventTypes[eventname][key] = {count: 1, first: metadata, description, last: metadata};
			} else {
				version.count++;
				version.last = metadata;
			}
		}
	});

	function describe(obj) {
		let description = {};
		Object.keys(obj)
			.sort()
			.forEach(prop => {
				description[prop] = typeof obj[prop] === "object" ? describe(obj[prop]) : typeof obj[prop];
				// TODO: Describe arrays
			});
		return description;
	}



	this.getLogSchema = function () {
		return Object.entries(eventTypes)
			.map(([eventname, versions]) => ({
				eventname,
				versions: Object.keys(versions).map(version => versions[version]).map(version => ({
					count: version.count,
					description: version.description,
					first: version.first,
					last: version.last
				}))
			}));
	}
}

module.exports = LogSchemaTool;