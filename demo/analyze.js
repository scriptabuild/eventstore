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

		let eventTypes = model.listEventTypes();
		Object.entries(eventTypes)
			.forEach(([eventname, versions]) => {
				console.log(`${eventname}`);
				versions.forEach(version => {
					console.log(`    ${version.count} events like ${JSON.stringify(version.description)}`);
				});
			});

	});



})();