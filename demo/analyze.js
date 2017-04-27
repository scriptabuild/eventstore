const path = require("path");
const defineStore = require("../source/defineStore.js");
const LogSchemaTool = require("../source/LogSchemaTool");
const Stopwatch = require("../source/stopwatch");
const folder = path.resolve(__dirname, "../temp");
// TODO: remove folder before running tests

(async function () {

	let store = await defineStore(folder);

	const createLogSchemaToolCallback = (dispatch, configureStore) => new LogSchemaTool(dispatch, configureStore);
	let logSchemaTool = store.defineReadModel("log-schema", createLogSchemaToolCallback);


	let stopwatch = Stopwatch.start();
	console.log("Analyzing Log")
	// await logSchemaTool.snapshot();
	await logSchemaTool.withReadModel((model) => {
		console.log(`Log Schema built in ${stopwatch.elapsed()} milliseconds`);

		// let eventTypes = model.getLogSchema();
		// Object.entries(eventTypes)
		// 	.forEach(([eventname, versions]) => {
		// 		console.log(`${eventname}`);
		// 		Object.keys(versions).map(version => versions[version]).forEach(version => {
		// 			console.log(`    ${version.count} ${version.count == 1 ? "instance" : "instances"} of ${JSON.stringify(version.description)} (First occurrence ${version.metadata.version || version.metadata.time || JSON.stringify(version.metadata.time)})`);
		// 		});
		// 	});

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