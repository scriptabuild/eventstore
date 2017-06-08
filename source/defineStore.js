const EventStore = require("./EventStore");
const camelToPascalCase = require("./camelToPascalCase");


module.exports = async function defineStore(folder, options = {}) {
	// async function ensureFolder(folder) {
	// 	try {
	// 		await options.fs.mkdir(folder);
	// 	} catch (err) {
	// 		if (err.code != 'EEXIST') throw err;
	// 	}
	// }

	// await ensureFolder(folder);

	let _eventStore = new EventStore(folder, options);

	async function buildInstance(modelDefinition, latestSnapshotNo, latestLogFileNo){
		let range = {
			from: latestSnapshotNo + 1,
			to: latestLogFileNo
		};

		let model;
		if(latestSnapshotNo){
			model = await _eventStore.restoreSnapshot(latestSnapshotNo, modelDefinition.snapshotName);
		}
		else if(typeof modelDefinition.initializeModel === "function"){
			model = modelDefinition.initializeModel( /* dispatchFn */ );
		}
		else {
			model = {};
		}

		await _eventStore.replayEventStream((event, headers) => {
			let eventhandler = modelDefinition.eventHandlers["on" + camelToPascalCase(event.name)] || modelDefinition.fallbackEventHandler || (() => () => {});
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

		defineModel(modelDefinition) {
			return {
				async snapshot() {
					if(modelDefinition.areSnapshotsEnabled){

						let allFiles = await _eventStore.getAllFilenames();
						let latestSnapshotNo = _eventStore.getLatestFileNo(allFiles, `.${modelDefinition.snapshotName}-snapshot`) || 0;
						let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");
						let model = await buildInstance(modelDefinition, latestSnapshotNo, latestLogFileNo);

						let snapshot = modelDefinition.createSnapshot(model)
						await _eventStore.saveSnapshot(snapshot, modelDefinition.snapshotName, latestLogFileNo);
					}
					return this;	// allows chaining functions
				},
				async withReadInstance(action) {

					let allFiles = await _eventStore.getAllFilenames();
					let latestSnapshotNo = _eventStore.getLatestFileNo(allFiles, `.${modelDefinition.snapshotName}-snapshot`) || 0;
					let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");
					let instance = await buildInstance(modelDefinition, latestSnapshotNo, latestLogFileNo);

					await action(instance);
					return this;	// allows chaining functions
				},
				async withReadWriteInstance(action, maxRetries = 5) {
					let isReadyToCommit = false;

					let retryCount = 0;
					while (retryCount < maxRetries) {
						let allFiles = await _eventStore.getAllFilenames();
						let latestSnapshotNo = _eventStore.getLatestFileNo(allFiles, `.${modelDefinition.snapshotName}-snapshot`) || 0;
						let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");
						let instance = await buildInstance(modelDefinition, latestSnapshotNo, latestLogFileNo);

						let readyToCommitCallback = () => { isReadyToCommit = true; };
						await action(instance, readyToCommitCallback);

						if (isReadyToCommit) {
							try {
								await _eventStore.saveEvents(events, ++latestLogFileNo);
								return this;	// allows chaining functions
							} catch (err) {
								retryCount++;
								continue;
							}
						} else {
							return this;	// allows chaining functions
						}

					}
					throw new Error("Failed the max number of retries. Aborting and rolling back action.");
				}
			}
		}

	}
}
