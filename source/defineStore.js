const Store = require("./Store");
const fsp = require("./AwaitableFs");
// const fsp = require("fs-promise");

async function defineStore(folder, options = {}) {
	async function ensureFolder(folder) {
		try {
			await options.fsp.mkdir(folder);
		} catch (err) {
			if (err.code != 'EEXIST') throw err;
		}
	}

	// options = {
	// 	fsp,
	// 	metadataCallback: () => {},
	// 	...options
	// }

	options.fsp = options.fsp || fsp;
	options.metadataCallback = options.metadataCallback || (() => {});
	await ensureFolder(folder);

	return {

		defineReadModel(modelname, createModelCallback) {
			let store = new Store(folder, modelname, createModelCallback, options);
			return {
				async snapshot(snapshotMetadata) {
					return await store.snapshot(snapshotMetadata);	
				},
				async withReadModel(action) {
					if (!store.instance) await store.init();
					action(store.instance);
				}
			}
		},

		// defineWriteModel() {
		// 	let store = new Store(folder);
		// 	// return an eventwriter
		// 	return {
		// 		writeEvents(){
		// 			store....
		// 		}
		// 	};
		// },

		defineReadWriteModel(modelname, createModelCallback) {
			let store = new Store(folder, modelname, createModelCallback, options);
			return {
				async snapshot(snapshotMetadata) {
					return await store.snapshot(snapshotMetadata);
				},
				async withReadWriteModel(action, maxRetries = 5) {
					let isReadyToCommitt = false;

					let retryCount = 0;
					while (retryCount < maxRetries) {
						if (!store.instance) await store.init();

						action(store.instance, () => { isReadyToCommitt = true; }); // the second param is the readyToCommit callback function

						if (isReadyToCommitt) {
							try {
								await store.save();
								return this;
							} catch (err) {
								retryCount++;
								continue;
							}
						} else {
							// TODO: replace with store.reset()
							store.instance = undefined;
							store.eventlog = [];
							return this;
						}

					}
					throw new Error("Failed the max number of retries. Aborting and rolling back action.");
				}
			}
		}
	};
}

module.exports = defineStore;