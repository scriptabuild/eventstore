const path = require("path");
const defineStore = require("../source/defineStore.js");
const logSchemaToolModelDefinition = require("../source/LogSchemaTool");
const Stopwatch = require("../source/stopwatch");
const folder = path.resolve(__dirname, "../temp");
// TODO: remove folder before running tests

(async function () {

	let store = await defineStore(folder);
	let logSchemaTool = store.defineModel(logSchemaToolModelDefinition);

	let stopwatch = Stopwatch.start();
	console.log("Analyzing Log")
	
	// await logSchemaTool.snapshot();
	await logSchemaTool.withReadInstance((model) => {
		console.log(`Log Schema built in ${stopwatch.elapsed()} milliseconds`);

		model.getLogSchema().forEach(eventTypeInformation => {
			console.log(eventTypeInformation.eventname);
			eventTypeInformation.versions.forEach(version => {
				let firstOccurrenceDescription = version.first.schemaVersion || version.first.version || version.first.time || JSON.stringify(version.first);
				let lastOccurrenceDescription = version.last.schemaVersion || version.last.version || version.last.time || JSON.stringify(version.last);
				console.log(`   ${version.count} ${version.count == 1 ? "instance" : "instances"} of ${JSON.stringify(version.description)} (from ${firstOccurrenceDescription} to ${lastOccurrenceDescription})`);
			});
		})
	});

})();