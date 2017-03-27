const defineStore = require("../source/defineStore");
const path = require("path");

(async function() {
	const folder = path.resolve(__dirname, "../temp");
	let store = defineStore(folder);

	// let readModel = store.defineReadModel(...);
	// store.defineReadModel(...);
	// let movingHistory = store.defineReadModel(...);

	// let writeModel = store.defineWriteModel(...);

	// let readWriteModel = store.defineReadWriteModel(...);
	const createContactlistFn = (dispatch, reh, rsh) => new Contactlist(dispatch, reh, rsh);
	// const stopReplayPredicate = (filename, events, instance) => (filename.endsWith("1.log"));
	let currentState = await store.defineReadWriteModel("currentState", createContactlistFn);

	// TODO: Write an autoproxy to intercept/record on all methods of a model.


	currentState.withReadWriteModel((model, commit) => {
		model.addCustomer("erlend", "jonasmyra 53");
		commit();
	});

	// writeModel.write((dispatch, commit) => {
	// 	dispatch({
	// 		type: "add-customer",
	// 		name: "erlend",
	// 		address: "jonasmyra 53"
	// 	});
	// 	commit();
	// });

	currentState.withReadWriteModel((model, commit) => {
		model.correctCustomerAddress("erlend", "jonasmyra 54");
		commit();
	});

	// movingHistory.snapshot();
	// movingHistory.read(model => {
	// 	model.customers["erlend"].history.forEach(address => console.log(address));
	// });

	// currentState.read(model => {
	// 	console.log(model.customers["erlend"].address);
	// });
})();