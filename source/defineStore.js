const EventStore = require("./EventStore");
const clone = require("./clone");
const camelToPascalCase = require("./camelToPascalCase");
const awaitableFs = require("./AwaitableFs");
const wrapInReadOnlyProxy = require("@scriptabuild/readonlyproxy")


module.exports = function defineStore(folder, options = {}) {	
	options.fs = options.fs || awaitableFs;	
	let _eventStore = new EventStore(folder, options);

	return {
		async ensureFolder() {
			if (/^win/.test(process.platform)) {
				try{
					await options.fs.mkdir(folder, 0o777);
					return;					
				}
				catch(err){
					throw new Error(".ensureFolder() will not recursivly create missing folders on Windows yet. Please submit a pull request if you fix this!");
	                //NOTE: On Windows, a file path will not start with /, but instead a drive letter or a UNC path. (Ie. C:, C:\ or \\)
				}
			}
			
			let lix = 0;
			while (lix != -1) {
				try {
					lix = folder.indexOf("/", lix + 1);
					let newFolder = lix === -1 ? folder : folder.substring(0, lix);
					await options.fs.mkdir(newFolder, 0o777);
				}
				catch (err) {
					if (err.code != 'EEXIST') throw err;
				}
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
			let logAggregatorData = undefined;
			let logAggregator = undefined;
			
			async function initializeLogAggregator(modelDefinition, latestSnapshotNo) {
				if (latestSnapshotNo && modelDefinition.snapshotName) {
					let snapshotName = modelDefinition.snapshotName;
					logAggregatorData = await _eventStore.restoreSnapshot(latestSnapshotNo, snapshotName);
				} else {
					logAggregatorData = modelDefinition.initializeLogAggregatorData();
				}
				let logAggregator = modelDefinition.createLogAggregator(logAggregatorData);
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

			let refreshLogAggregator = async () => {
				let allFiles = await _eventStore.getAllFilenames(folder);
				let latestSnapshotNo = snapshotName ? _eventStore.getLatestFileNo(allFiles, `.${snapshotName}-snapshot`) || 0 : 0;
				let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");

				logAggregator = logAggregator || await initializeLogAggregator(modelDefinition, latestSnapshotNo);
				await forwardLogAggregator(logAggregator, modelDefinition, latestLogFileNo);
			};



			return {
				async snapshot() {
					if (snapshotName) {
						await refreshLogAggregator();
						let allFiles = await _eventStore.getAllFilenames(folder);
						let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");

						let snapshot = logAggregator.data;
						
						await _eventStore.saveSnapshot(snapshot, snapshotName, latestLogFileNo);
					}
				},

				async getAggregatorData() {
					await refreshLogAggregator();

					return wrapInReadOnlyProxy(logAggregatorData);
				},

				//TODO: Can .withReadInstance(action) be made obsolete, by using .getAggregatorData() instead???
				async withReadInstance(action) {
					await refreshLogAggregator();

					let dispatch = () => {};
					let domainModel = modelDefinition.createDomainModel(dispatch, wrapInReadOnlyProxy(logAggregatorData));

					return await action(domainModel);
				},

				async withReadWriteInstance(action, maxRetries = 5) {
					let isReadyToCommit = false;

					let retryCount = 0;
					while (retryCount < maxRetries) {
						let allFiles = await _eventStore.getAllFilenames(folder);
						let latestSnapshotNo = snapshotName ? _eventStore.getLatestFileNo(allFiles, `.${snapshotName}-snapshot`) || 0 : 0;
						let latestLogFileNo = _eventStore.getLatestFileNo(allFiles, ".log");

						logAggregator = logAggregator || await initializeLogAggregator(modelDefinition, latestSnapshotNo);
						await forwardLogAggregator(logAggregator, modelDefinition, latestLogFileNo);

						let events = [];
						let dispatch = (eventName, eventData) => {
							events.push({ name: eventName, data: eventData });
						};

						let copyOfLogAggregatorData = clone(logAggregatorData);
						let domainModel = modelDefinition.createDomainModel(dispatch, wrapInReadOnlyProxy(copyOfLogAggregatorData));

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