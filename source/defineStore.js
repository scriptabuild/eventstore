const EventStore = require("./EventStore");
// const SnapshotStore = require("./SnapshotStore");
const path = require("path");
const camelToPascalCase = require("./camelToPascalCase");
//const fs = require("./AwaitableFs");

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

	async function buildModel(readModelDefinition, latestSnapshotNo, latestLogFileNo){
		let range = {
			from: latestSnapshotNo + 1,
			to: latestLogFileNo
		};

		let model;
		if(latestSnapshotNo){
			model = await _eventStore.restoreSnapshot(latestSnapshotNo, readModelDefinition.snapshotName);
		}
		else if(typeof readModelDefinition.initializeModel === "function"){
			model = readModelDefinition.initializeModel();
		}
		else {
			model = {};
		}

		await _eventStore.replayEventStream((event, headers) => {
			let eventhandler = readModelDefinition.eventHandlers["on" + camelToPascalCase(event.name)] || readModelDefinition.fallbackEventHandler || (() => () => {});
			return eventhandler(model)(event.data, headers);
		}, range);

		return model;
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
			return {
				async snapshot() {
					if(readModelDefinition.areSnapshotsEnabled){

						let allFiles = await _eventStore.getAllFilenames();
						let latestSnapshotNo = _eventStore.getLatestFileNo(allFiles, `.${readModelDefinition.snapshotName}-snapshot`) || 0;						
						let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");
						let model = await buildModel(readModelDefinition, latestSnapshotNo, latestLogFileNo);

						let snapshot = readModelDefinition.createSnapshot(model)
						await _eventStore.saveSnapshot(snapshot, readModelDefinition.snapshotName, latestLogFileNo);
					}
				},
				async withReadModel(action) {

					let allFiles = await _eventStore.getAllFilenames();
					let latestSnapshotNo = _eventStore.getLatestFileNo(allFiles, `.${readModelDefinition.snapshotName}-snapshot`) || 0;						
					let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");
					let model = await buildModel(readModelDefinition, latestSnapshotNo, latestLogFileNo);

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

