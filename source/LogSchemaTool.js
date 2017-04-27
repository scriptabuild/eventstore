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
				eventTypes[eventname] = {};	// versions: {description: {...}, count: 1}
			}

			let description = describe(eventdata);

			// let ix = eventTypes[eventname]
			// 	.map(version => JSON.stringify(version.description))
			// 	.indexOf(JSON.stringify(description));

			let key = JSON.stringify(description);
			let d = eventTypes[eventname][key];
			if(!d){
				eventTypes[eventname][key] = {count: 1, metadata, description};
			} else {
				d.count++;
			}

			// if (!eventTypes[eventname]) {
			// 	eventTypes[eventname] = [];	// versions: {description: {...}, count: 1}
			// }

			// let description = describe(eventdata);

			// let ix = eventTypes[eventname]
			// 	.map(version => JSON.stringify(version.description))
			// 	.indexOf(JSON.stringify(description));

			// if(ix === -1){
			// 	eventTypes[eventname].push({count: 1, description});
			// } else {
			// 	eventTypes[eventname][ix].count++;
			// }
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
					metadata: version.metadata
				}))
			}));

	}
}

module.exports = LogSchemaTool;