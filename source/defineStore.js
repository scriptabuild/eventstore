const Store = require("./Store");
const fs = require("./AwaitableFs");

async function defineStore(folder, options = {}) {
	async function ensureFolder(folder) {
		try {
			await options.fs.mkdir(folder);
		} catch (err) {
			if (err.code != 'EEXIST') throw err;
		}
	}

	options.fs = options.fs || fs;
	options.console = options.console || {log(){}};
	options.createHeaders = options.createHeaders || (() => ({time: new Date().toISOString()}));
	await ensureFolder(folder);

	return {

		defineReadModel(modelname, createModelCallback) {
			let store = new Store(folder, modelname, createModelCallback, options);
			return {
				async snapshot(snapshotMetadata) {
					// return await store.snapshot(snapshotMetadata);	
				},
				async withReadModel(action) {
					// if (!store.instance)
					await store.init();
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

		// replayLogs(){
		//		// TODO: Make sure that we dont use a snapshot when replaying the log
		// },

		defineReadWriteModel(modelname, createModelCallback) {
			let store = new Store(folder, modelname, createModelCallback, options);
			return {
				async snapshot(snapshotMetadata) {
					// return await store.snapshot(snapshotMetadata);
				},
				async withReadWriteModel(action, maxRetries = 5) {
					let isReadyToCommitt = false;

					let retryCount = 0;
					while (retryCount < maxRetries) {
						if (!store.instance) await store.init();

						let readyToCommitCallback = () => { isReadyToCommitt = true; };
						await action(store.instance, readyToCommitCallback);

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