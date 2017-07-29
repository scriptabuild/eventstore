const EventStore = require("./EventStore");
const clone = require("./clone");
const wrapInReadOnlyProxy = require("./wrapInReadOnlyProxy")
const camelToPascalCase = require("./camelToPascalCase");


module.exports = async function defineStore(folder, options = {}) {
    let _eventStore = new EventStore(folder, options);

    async function initializeLogAggregator(modelDefinition, latestSnapshotNo) {
        let snapshotData;
        if (latestSnapshotNo) {
            let snapshotConfiguration = modelDefinition.snapshotConfiguration;
            snapshotData = await _eventStore.restoreSnapshot(latestSnapshotNo, snapshotConfiguration.snapshotName);
        }
		let logAggregator = modelDefinition.createLogAggregator(snapshotData, wrapInReadOnlyProxy);
		logAggregator.currentFileNo = latestSnapshotNo;
		return logAggregator;
	}

	async function forwardLogAggregator(logAggregator, modelDefinition, latestLogFileNo) {
        let range = {
            from: logAggregator.currentFileNo + 1,
            to: latestLogFileNo
		};

        let eventHandlers = modelDefinition.getEventHandlers && modelDefinition.getEventHandlers(logAggregator);
        eventHandlers = eventHandlers || {};

        await _eventStore.replayEventStream((event, headers) => {
            let eventHandler = eventHandlers["on" + camelToPascalCase(event.name)] || modelDefinition.fallbackEventHandler || (() => () => {});
            if (eventHandler) {
                eventHandler(event.data, headers);
                return;
            }

            let fallbackEventHandler = modelDefinition.fallbackEventHandler;
            if (fallbackEventHandler) {
                fallbackEventHandler(event.name, event.data, headers);
                return;
            }
		}, range);
		
		logAggregator.currentFileNo = latestLogFileNo;
        return logAggregator;
    }

    return {
        async ensureFolder() {
            try {
                await options.fs.mkdir(folder);
            }
            catch (err) {
                if (err.code != 'EEXIST') throw err;
            }
        },

        async log(eventObj) {
            await _eventStore.log(eventObj);
        },

        async logBlock(action) {
            await _eventStore.logBlock(action);
        },

        async replayEventStream(handleEvents) {
            await _eventStore.replayEventStream(handleEvents);
        },

        defineModel(modelDefinition) {
            let snapshotConfiguration = modelDefinition.snapshotConfiguration;
            let logAggregator = undefined;
            
            return {
                async snapshot() {
                    if (snapshotConfiguration) {
                        let allFiles = await _eventStore.getAllFilenames(folder);
                        let latestSnapshotNo = _eventStore.getLatestFileNo(allFiles, `.${snapshotConfiguration.snapshotName}-snapshot`) || 0;
                        let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");
                        logAggregator = logAggregator || await initializeLogAggregator(modelDefinition, latestSnapshotNo);
						await forwardLogAggregator(logAggregator, modelDefinition, latestLogFileNo);

                        let snapshot = snapshotConfiguration.createSnapshotData(logAggregator);
                        await _eventStore.saveSnapshot(snapshot, snapshotConfiguration.snapshotName, latestLogFileNo);
                    }
                },

                async withReadInstance(action) {
                    let allFiles = await _eventStore.getAllFilenames(folder);
                    let latestSnapshotNo = snapshotConfiguration ? _eventStore.getLatestFileNo(allFiles, `.${snapshotConfiguration.snapshotName}-snapshot`) || 0 : 0;
                    let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");

					let dispatch = () => {};
                    logAggregator = logAggregator || await initializeLogAggregator(modelDefinition, latestSnapshotNo);
					await forwardLogAggregator(logAggregator, modelDefinition, latestLogFileNo);
					let domainModel = modelDefinition.createDomainModel(dispatch, logAggregator);

                    await action(domainModel);
                },

                async withReadWriteInstance(action, maxRetries = 5) {
                    let isReadyToCommit = false;

                    let retryCount = 0;
                    while (retryCount < maxRetries) {
                        let allFiles = await _eventStore.getAllFilenames(folder);
                        let latestSnapshotNo = snapshotConfiguration ? _eventStore.getLatestFileNo(allFiles, `.${snapshotConfiguration.snapshotName}-snapshot`) || 0 : 0;
                        let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");

                        let events = [];
                        let dispatch = (eventName, eventData) => {
                            events.push({ name: eventName, data: eventData });
						};
						logAggregator = logAggregator || await initializeLogAggregator(modelDefinition, latestSnapshotNo);
						await forwardLogAggregator(logAggregator, modelDefinition, latestLogFileNo);

                        let domainModel = modelDefinition.createDomainModel(dispatch, clone(logAggregator));

                        let readyToCommitCallback = () => { isReadyToCommit = true; };
                        await action(domainModel, readyToCommitCallback);

                        if (isReadyToCommit) {
                            try {
                                await _eventStore.saveEvents(events, ++latestLogFileNo);
                                return;
                            }
                            catch (err) {
                                retryCount++;
                                continue;
                            }
                        }
                        else {
                            return;
                        }

                    }
                    throw new Error("Failed the max number of retries. Aborting and rolling back action.");
                }
            }
        }

    }
}