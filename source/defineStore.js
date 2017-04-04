const fsp = require("fs-promise");
const path = require("path");

class Store {
	constructor(folder, modelname, createModelCallback, metadataCallback = () => {}) {
		this.folder = folder;
		this.modelname = modelname;
		this.createModelCallback = createModelCallback;

		this.instance = undefined;

		this._eventhandlers = undefined;
		this._snapshothandlers = undefined;
		this._metadataCallback = metadataCallback;

		this._latestLogOrSnapshotNo = undefined;
		this.eventlog = [];
	}

	getLatestFileNo(files, ext) {
		return files
			.map(files => path.parse(files))
			.filter(fi => fi.ext == ext && !isNaN(fi.name))
			.map(fi => parseInt(fi.name, 10))
			.reduce((max, num) => num > max ? num : max, 0);
	}

	camelToPascalCase(camelcaseString) {
		return camelcaseString[0].toUpperCase() + camelcaseString.substring(1);
	}

	async init() {
		if (!this.instance) this.instance = this.createModelCallback(this.dispatch.bind(this), this.registerEventhandlers.bind(this), this.registerSnapshothandlers.bind(this));

		let files = await fsp.readdir(this.folder);
		let latestSnapshotNo = this.getLatestFileNo(files, `.${this.modelname}-snapshot`);
		let latestLogNo = this.getLatestFileNo(files, ".log");
		this._latestLogOrSnapshotNo = Math.max(latestSnapshotNo, latestLogNo)

		if (latestSnapshotNo) {
			await this.restoreSnapshot(latestSnapshotNo);
		}
		await this.replay(latestSnapshotNo + 1, latestLogNo);
	}

	registerEventhandlers(newEventhandlers) {
		this._eventhandlers = newEventhandlers
	}

	registerSnapshothandlers(newSnapshothandlers) {
		this._snapshothandlers = newSnapshothandlers
	}

	async restoreSnapshot(snapshotNo) {
		if (this._snapshothandlers === undefined) throw new Error(`Can't restore snapshot. Missing snapshothandler for "${this.modelname}".`);

		let snapshotfile = path.resolve(this.folder, snapshotNo + `.${this.modelname}-snapshot`);
		console.log("Reading snapshot file:", snapshotfile);

		let file = await fsp.readFile(snapshotfile);
		let snapshotContents = JSON.parse(file.toString());
		this._snapshothandlers.restoreFromSnapshot(snapshotContents.snapshot);
		// return {metadata: snapshotContents.metadata, customMetadata: snapshotContents.customMetadata}; // would this be usefull to anyone?
	}

	async replay(fromLogNo, toLogNo, stopReplayPredicates) {
		for (let logNo = fromLogNo; logNo <= toLogNo; logNo++) {
			let logfile = path.resolve(this.folder, logNo + ".log");
			console.log("Reading log file:", logfile);

			let file = await fsp.readFile(logfile);
			let logfileContents = JSON.parse(file.toString());
			if(stopReplayPredicates && stopReplayPredicates.BeforeApply && stopReplayPredicates.BeforeApply(file, logfileContents, this.instance)){
				break;
			}
			let events = logfileContents.events;
			events.forEach(eventEntry => {
				this.handleEvent(eventEntry.eventname, eventEntry.event);
			});

			if(stopReplayPredicates && stopReplayPredicates.AfterApply && stopReplayPredicates.AfterApply(file, logfileContents, this.instance)){
				break;
			}
		}
	}

	handleEvent(eventname, event) {
		let eventhandlername = "on" + this.camelToPascalCase(eventname);
		let eventhandler = this._eventhandlers[eventhandlername];

		// TODO: should a RW model have ALL commandhandlers?
		// if (eventhandler === undefined) {
		// 	throw new Error(`Cannot handle event. Can't find "${eventhandlername}" eventhandler.`);
		// }

		eventhandler && eventhandler(event);
	}

	dispatch(eventname, event) {
		this.eventlog.push({
			eventname,
			event
		});
		this.handleEvent(eventname, event);
	}

	async save() {
		try {
			if (this.eventlog && this.eventlog.length) {
				let metadata = this._metadataCallback();

				let logfile = path.resolve(this.folder, ++this._latestLogOrSnapshotNo + ".log");
				await fsp.appendFile(logfile, JSON.stringify({ metadata, events: this.eventlog}), {
					flag: "wx"
				});

				this.eventlog = [];
			}
		} catch (err) {
			console.error(err);
		}
	}

	async snapshot(snapshotMetadata) {
		if (!this.instance) await this.init();

		let metadata = this._metadataCallback();

		let state = { metadata, snapshotMetadata, snapshot: this._snapshothandlers.createSnapshotData() };
		let snapshotfile = path.resolve(this.folder, this._latestLogOrSnapshotNo + `.${this.modelname}-snapshot`);
		await fsp.appendFile(snapshotfile, JSON.stringify(state), {
			flag: "w"
		});
	}
}

// TODO: Add resetModel() and getModel()/ensureModel() methods5
// TODO: Rename Store::init() to reset()/restore()???

async function defineStore(folder) {
	async function ensureFolder(folder) {
		try {
			await fsp.mkdir(folder);
		} catch (err) {
			if (err.code != 'EEXIST') throw err;
		}
	}

	await ensureFolder(folder);

	return {

		defineReadModel(modelname, createModelCallback) {
			let store = new Store(folder, modelname, createModelCallback);
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
			let store = new Store(folder, modelname, createModelCallback);
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