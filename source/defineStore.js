const EventStore = require("./EventStore");
// const SnapshotStore = require("./SnapshotStore");
const path = require("path");
// const fs = require("./AwaitableFs");

module.exports = async function defineStore(folder, options = {}) {
	// async function ensureFolder(folder) {
	// 	try {
	// 		await options.fs.mkdir(folder);
	// 	} catch (err) {
	// 		if (err.code != 'EEXIST') throw err;
	// 	}
	// }

	// options.fs = options.fs || fs;
	// options.console = options.console || {log(){}};
	options.createHeaders = options.createHeaders || (() => ({time: new Date().toISOString()}));

	// await ensureFolder(folder);

	let _eventStore = new EventStore(folder, options);

	async function saveSnapshot(snapshot, modelName, fileNo){
		let headers = options.createHeaders();

		let logfile = path.resolve(this.folder, `${++fileNo}.${modelName}-snapshot`);
		await this._fs.appendFile(logfile, JSON.stringify({headers, snapshot}), {flag: "wx"});
	}

	return {
		async log(eventObj) {
			await _eventStore.log(eventObj);
		},

		async logBlock(action) {
			await _eventStore.logBlock(action);
		},

		async replayEventStream(handleEvents){
			await _eventStore.replayEventStream(handleEvents);
		},

		defineReadModel(readModelDefinition) {
			// let store = new Store(folder, modelname, createModelCallback, options);
			return {
				async snapshot() {
					if(readModelDefinition.snapshotsAreEnabled){
					await this.withReadModel(async model => {
						let snapshot = readModelDefinition.createSnapshot(model)
						await saveSnapshot(snapshot, readModelDefinition.snapshotName);
					});

					}
				},
				async withReadModel(action) {
					let model = readModelDefinition.initModel();
					await _eventStore.replayEventStream(readModelDefinition.handleEvents)
					await action(model);
				}
			}
		},

		// defineReadWriteModel(x) {
		// 	// let store = new Store(folder, modelname, createModelCallback, options);
		// 	return {
		// 		async snapshot() {
		// 			// return await store.snapshot(snapshotMetadata);
		// 		},
		// 		async withReadWriteModel(action, maxRetries = 5) {
		// 			// let isReadyToCommitt = false;

		// 			// let retryCount = 0;
		// 			// while (retryCount < maxRetries) {
		// 			// 	if (!store.instance) await store.init();

		// 			// 	let readyToCommitCallback = () => { isReadyToCommitt = true; };
		// 			// 	await action(store.instance, readyToCommitCallback);

		// 			// 	if (isReadyToCommitt) {
		// 			// 		try {
		// 			// 			await store.save();
		// 			// 			return this;
		// 			// 		} catch (err) {
		// 			// 			retryCount++;
		// 			// 			continue;
		// 			// 		}
		// 			// 	} else {
		// 			// 		// TODO: replace with store.reset()
		// 			// 		store.instance = undefined;
		// 			// 		store.eventlog = [];
		// 			// 		return this;
		// 			// 	}

		// 			// }
		// 			// throw new Error("Failed the max number of retries. Aborting and rolling back action.");
		// 		}
		// 	}
		// }
	};
}

