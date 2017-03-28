const fsp = require("fs-promise");
const path = require("path");

async function defineStore(folder) {
	async function ensureFolder(folder) {
		try {
			await fsp.mkdir(folder);
		} catch (err) {
			if (err.code != 'EEXIST') throw err;
		}
	}

	function getLatestFileNo(files, ext) {
		return files
			.map(files => path.parse(files))
			.filter(fi => fi.ext == ext && !isNaN(fi.name))
			.map(fi => parseInt(fi.name))
			.reduce((max, num) => num > max ? num : max, 0);
	}

	function camelToPascalCase(camelcaseString) {
		return camelcaseString[0].toUpperCase() + camelcaseString.substring(1);
	}


	await ensureFolder(folder);

	let public = {

		// defineReadModel(modelname, createModelFn) {
		// 	return {
		// 		async snapshot() {
		// 			if (!instance) init();

		// 			let state = snapshothandlers.createSnapshotData();

		// 			let snapshotfile = path.resolve(folder, latestLogOrSnapshotNo + `.${modelname}-snapshot`);
		// 			await fsp.appendFile(snapshotfile, JSON.stringify(state), {
		// 				flag: "w"
		// 			});
		// 		},
		// 		async withReadModel(action) {
		// 			if (!instance) await init();
		// 			action(instance);
		// 		}
		// 	}
		// },

		// defineWriteModel(fn) {
		// 	// return an eventwriter
		// },

		defineReadWriteModel(modelname, createInstance) {
			let instance = undefined;

			let eventhandlers = undefined;
			let snapshothandlers = undefined;

			let latestLogOrSnapshotNo = undefined;
			let eventlog = [];

			async function init() {
				if (!instance) instance = createInstance(dispatch, registerEventhandlers, registerSnapshothandlers);

				let files = await fsp.readdir(folder);
				let latestSnapshotNo = getLatestFileNo(files, `.${modelname}-snapshot`);
				let latestLogNo = getLatestFileNo(files, ".log");
				latestLogOrSnapshotNo = Math.max(latestSnapshotNo, latestLogNo)

				if (latestSnapshotNo) {
					await restore(latestSnapshotNo);
				}
				await replay(latestSnapshotNo + 1, latestLogNo);
			}

			function registerEventhandlers(newEventhandlers) {
				eventhandlers = newEventhandlers
			}

			function registerSnapshothandlers(newSnapshothandlers) {
				snapshothandlers = newSnapshothandlers
			}

			async function restore(snapshotNo) {
				if (snapshothandlers === undefined) throw new Error(`Can't restore snapshot. Missing snapshothandler for "${modelname}".`);

				let snapshotfile = path.resolve(folder, snapshotNo + `.${modelname}-snapshot`);
				console.log("Reading snapshot file:", snapshotfile);

				let file = await fsp.readFile(snapshotfile);
				let snapshotContents = JSON.parse(file.toString());
				snapshothandlers.restoreFromSnapshot(snapshotContents);
			}

			async function replay(fromLogNo, toLogNo) {
				for (let logNo = fromLogNo; logNo <= toLogNo; logNo++) {
					let logfile = path.resolve(folder, logNo + ".log");
					console.log("Reading log file:", logfile);

					let file = await fsp.readFile(logfile);
					let events = JSON.parse(file.toString());

					events.forEach(eventEntry => {
						handleEvent(eventEntry.eventname, eventEntry.event);
					});

					// if (stopReplayAfterPredicate && stopReplayAfterPredicate(logfile, events, instance))
					// 	break;
				}
			}

			function handleEvent(eventname, event) {
				let eventhandlername = "on" + camelToPascalCase(eventname);
				let eventhandler = eventhandlers[eventhandlername];
				if (eventhandler === undefined) {
					throw new Error(`Cannot handle event. Can't find "${eventhandlername}" eventhandler.`);
				}

				return eventhandler(event);
			}

			function dispatch(eventname, event) {
				eventlog.push({
					eventname,
					event
				});
				handleEvent(eventname, event);
			}

			async function save() {
				try {
					if (eventlog && eventlog.length) {
						let logfile = path.resolve(folder, ++latestLogOrSnapshotNo + ".log");
						await fsp.appendFile(logfile, JSON.stringify(eventlog), {
							flag: "wx"
						});

						eventlog = [];
					}
				} catch (err) {
					console.error(err);
				}
			}

			return {
				async snapshot() {
					if (!instance) init();

					let state = snapshothandlers.createSnapshotData();

					let snapshotfile = path.resolve(folder, latestLogOrSnapshotNo + `.${modelname}-snapshot`);
					await fsp.appendFile(snapshotfile, JSON.stringify(state), {
						flag: "w"
					});
				},
				async withReadWriteModel(action, maxRetries = 5) {
					let isReadyToCommitt = false;

					let retryCount = 0;
					while (retryCount < maxRetries) {
						if (!instance) await init();

						action(instance, () => {
							isReadyToCommitt = true;
						}); // the second param is the readyToCommit callback function?

						if (isReadyToCommitt) {
							try {
								await save();
								return this;
							} catch (err) {
								retryCount++;
								continue;
							}
						} else {
							instance = undefined;
							eventlog = [];
							return this;
						}

					}
					throw new Error("Failed the max number of retries. Aborting and rolling back action.");
				}
			}
		}
	};

	return public;
};

module.exports = defineStore;