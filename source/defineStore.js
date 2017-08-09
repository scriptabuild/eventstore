const EventStore = require("./EventStore");
const clone = require("./clone");
const camelToPascalCase = require("./camelToPascalCase");


module.exports = function defineStore(folder, options = {}) {
    let _eventStore = new EventStore(folder, options);

    async function initializeLogAggregator(modelDefinition, latestSnapshotNo) {
        let snapshot;
        if (latestSnapshotNo && modelDefinition.snapshotName) {
            let snapshotName = modelDefinition.snapshotName;
            snapshot = await _eventStore.restoreSnapshot(latestSnapshotNo, snapshotName);
        }
        let logAggregator = modelDefinition.createLogAggregator(snapshot);
        logAggregator.currentFileNo = latestSnapshotNo;
        return logAggregator;
    }

    async function forwardLogAggregator(logAggregator, modelDefinition, latestLogFileNo) {
        let range = {
            from: logAggregator.currentFileNo + 1,
            to: latestLogFileNo
        };

        let eventHandlers = logAggregator.eventHandlers || {};

        await _eventStore.replayEventStream((event, headers) => {
            let eventHandler = eventHandlers["on" + camelToPascalCase(event.name)];
            if (eventHandler) {
                eventHandler(event.data, headers);
                return;
            }

            let fallbackEventHandler = logAggregator.fallbackEventHandler;
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
            let snapshotName = modelDefinition.snapshotName;
            let logAggregator = undefined;

            return {
                async snapshot() {
                    if (snapshotName) {
                        let allFiles = await _eventStore.getAllFilenames(folder);
                        let latestSnapshotNo = _eventStore.getLatestFileNo(allFiles, `.${snapshotName}-snapshot`) || 0;
                        let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");
                        logAggregator = logAggregator || await initializeLogAggregator(modelDefinition, latestSnapshotNo);
                        await forwardLogAggregator(logAggregator, modelDefinition, latestLogFileNo);

                        let snapshot = logAggregator.data;
                        await _eventStore.saveSnapshot(snapshot, snapshotName, latestLogFileNo);
                    }
                },

                async withReadInstance(action) {
                    let allFiles = await _eventStore.getAllFilenames(folder);
                    let latestSnapshotNo = snapshotName ? _eventStore.getLatestFileNo(allFiles, `.${snapshotName}-snapshot`) || 0 : 0;
                    let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");

                    let dispatch = () => {};
                    logAggregator = logAggregator || await initializeLogAggregator(modelDefinition, latestSnapshotNo);
                    await forwardLogAggregator(logAggregator, modelDefinition, latestLogFileNo);
                    let domainModel = modelDefinition.createDomainModel(dispatch, logAggregator);

                    return await action(domainModel);
                },

                async withReadWriteInstance(action, maxRetries = 5) {
                    let isReadyToCommit = false;

                    let retryCount = 0;
                    while (retryCount < maxRetries) {
                        let allFiles = await _eventStore.getAllFilenames(folder);
                        let latestSnapshotNo = snapshotName ? _eventStore.getLatestFileNo(allFiles, `.${snapshotName}-snapshot`) || 0 : 0;
                        let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");

                        let events = [];
                        let dispatch = (eventName, eventData) => {
                            events.push({ name: eventName, data: eventData });
                        };
                        logAggregator = logAggregator || await initializeLogAggregator(modelDefinition, latestSnapshotNo);
                        await forwardLogAggregator(logAggregator, modelDefinition, latestLogFileNo);

                        let domainModel = modelDefinition.createDomainModel(dispatch, clone(logAggregator));

                        let readyToCommitCallback = () => { isReadyToCommit = true; };
                        let ret = action(domainModel, readyToCommitCallback);

                        if (isReadyToCommit) {
                            try {
                                await _eventStore.saveEvents(events, ++latestLogFileNo);
                                return ret;
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