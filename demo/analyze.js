const path = require("path");
const defineStore = require("../source/defineStore.js");
const EventAnalyzer = require("../source/eventAnalyzer");

const folder = path.resolve(__dirname, "../temp");
// TODO: remove folder before running tests

(async function () {

	let store = await defineStore(folder);

	const createEventAnalyzerCallback = (dispatch, reh, rsh) => new EventAnalyzer(dispatch, reh, rsh);
	let analyzerModel = store.defineReadModel("analyzer", createEventAnalyzerCallback);



	// await analyzerModel.snapshot();
	await analyzerModel.withReadModel((model) => {
		let eventTypes = model.listEventTypes();
		Object.keys(eventTypes).map(eventType => ({name: eventType, count: eventTypes[eventType].count, description: eventTypes[eventType].description})).forEach(eventType => {
			console.log(`${eventType.name} - ${eventType.count} event(s) - ${JSON.stringify(eventType.description)}`);
		});
	});


})();