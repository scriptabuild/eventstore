const path = require("path");
const defineStore = require("../source/defineStore.js");
const EventAnalyzer = require("../source/eventAnalyzer");

const folder = path.resolve(__dirname, "../temp");
// TODO: remove folder before running tests

(async function () {

	let store = await defineStore(folder);

	const createEventAnalyzerCallback = (dispatch, reh, rsh) => new EventAnalyzer(dispatch, reh, rsh);
	let analyzerModel = store.defineReadModel("analyzer", createEventAnalyzerCallback);



	await analyzerModel.snapshot();
	await analyzerModel.withReadModel((model) => {
		model.listEventtypes().forEach(eventtype => console.log(`${eventtype.name} - ${JSON.stringify(eventtype)}`));		

	});


})();