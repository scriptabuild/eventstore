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

	async function buildLogAggregator(modelDefinition, latestSnapshotNo, latestLogFileNo){
		let range = {
			from: latestSnapshotNo + 1,
			to: latestLogFileNo
		};

		let snapshotData;
		if(latestSnapshotNo){
			let snapshotConfiguration = modelDefinition.snapshotConfiguration;
			snapshotData = await _eventStore.restoreSnapshot(latestSnapshotNo, snapshotConfiguration.snapshotName);
		}
		let logAggregator = modelDefinition.createLogAggregator(snapshotData);
		let eventHandlers = modelDefinition.getEventHandlers(logAggregator);

		await _eventStore.replayEventStream((event, headers) => {
			let eventhandler = eventHandlers["on" + camelToPascalCase(event.name)] || modelDefinition.fallbackEventHandler || (() => () => {});
			// let eventhandler = modelDefinition.eventHandlers["on" + camelToPascalCase(event.name)] || modelDefinition.fallbackEventHandler || (() => () => {});
			return eventhandler(event.data, headers);
		}, range);

		return logAggregator;
	}



	async function buildDomainModel(modelDefinition, latestSnapshotNo, latestLogFileNo, dispatch){
		let storeModel = await buildLogAggregator(modelDefinition, latestSnapshotNo, latestLogFileNo);
		let domainModel = modelDefinition.createDomainModel(dispatch, storeModel);
		return domainModel;
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
			let snapshotConfiguration = modelDefinition.snapshotConfiguration;

			return {
				async snapshot() {
					if(snapshotConfiguration){
						let allFiles = await _eventStore.getAllFilenames();
						let latestSnapshotNo = _eventStore.getLatestFileNo(allFiles, `.${snapshotConfiguration.snapshotName}-snapshot`) || 0;
						let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");
						let storeModel = await buildLogAggregator(modelDefinition, latestSnapshotNo, latestLogFileNo);

						let snapshot = snapshotConfiguration.createSnapshotData(storeModel);
						await _eventStore.saveSnapshot(snapshot, snapshotConfiguration.snapshotName, latestLogFileNo);
					}
					return this;	// allows chaining functions
				},
				async withReadInstance(action) {

					let allFiles = await _eventStore.getAllFilenames();
					let latestSnapshotNo = snapshotConfiguration ? _eventStore.getLatestFileNo(allFiles, `.${snapshotConfiguration.snapshotName}-snapshot`) || 0 : 0;
					let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");

					let domainModel = await buildDomainModel(modelDefinition, latestSnapshotNo, latestLogFileNo, () => {});

					await action(domainModel);
					return this;	// allows chaining functions
				},
				async withReadWriteInstance(action, maxRetries = 5) {
					let isReadyToCommit = false;

					let retryCount = 0;
					while (retryCount < maxRetries) {
						let allFiles = await _eventStore.getAllFilenames();
						let latestSnapshotNo = snapshotConfiguration ? _eventStore.getLatestFileNo(allFiles, `.${snapshotConfiguration.snapshotName}-snapshot`) || 0 : 0;
						let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");

						let events = [];
						let dispatch = (eventName, eventData) => {
							events.push({name: eventName, data: eventData});
						};
						let domainModel = await buildDomainModel(modelDefinition, latestSnapshotNo, latestLogFileNo, dispatch);

						let readyToCommitCallback = () => { isReadyToCommit = true; };
						await action(domainModel, readyToCommitCallback);

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
