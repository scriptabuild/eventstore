//
// Tool to determine the logged events schema
// This tool is made like a readOnlyModel for replaying event to find what event types/names/params/payloads in a log
// Should record version info
// - first (and last?) occurrence date
// - when params/payload change shape
// - other version information
//
const wrapInReadOnlyProxy = require("@scriptabuild/readonlyproxy")

function DomainModel(dispatch, logAggregator) {

	this.getLogSchema = function() {
		let logSchema = logAggregator.data();
		return Object.entries(logSchema)
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

function LogAggregator(snapshot = {}) {
	let eventTypes = snapshot;

	Object.defineProperty(this, "data", { value: wrapInReadOnlyProxy(eventTypes), writable: false});

	this.fallbackEventHandler = (eventname, eventdata, headers) => {
		if (!eventTypes[eventname]) {
			eventTypes[eventname] = {};
		}

		let description = describe(eventdata);

		let key = JSON.stringify(description);
		let version = eventTypes[eventname][key];
		if (!version) {
			eventTypes[eventname][key] = { count: 1, first: headers, description, last: headers };
		}
		else {
			version.count++;
			version.last = headers;
		}
	}

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
}

let modelDefinition = {
	snapshotName: "log-schema",
	createLogAggregator: snapshot => new LogAggregator(snapshot),
	createDomainModel: (dispatch, logAggregator) => new DomainModel(dispatch, logAggregator)
};


module.exports = modelDefinition;