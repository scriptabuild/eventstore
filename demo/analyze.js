const path = require("path");
const defineStore = require("../source/defineStore.js");
const LogSchemaTool = require("../source/LogSchemaTool");

const folder = path.resolve(__dirname, "../temp");
// TODO: remove folder before running tests

(async function () {

	let store = await defineStore(folder);

	const createLogSchemaToolCallback = (dispatch, reh, rsh) => new LogSchemaTool(dispatch, reh, rsh);
	let logSchemaTool = store.defineReadModel("log-schema", createLogSchemaToolCallback);



	// await logSchemaTool.snapshot();
	await logSchemaTool.withReadModel((model) => {

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