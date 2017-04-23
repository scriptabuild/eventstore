// const fsp = require("fs-promise");
const path = require("path");

class Store {
	constructor(folder, modelname, createModelCallback, options) {
		this.folder = folder;
		this.modelname = modelname;
		this.createModelCallback = createModelCallback;

		this.instance = undefined;

		this._eventhandlers = undefined;
		this._fallbackEventhandler = undefined;
		this._snapshothandlers = undefined;
		this._metadataCallback = options.metadataCallback;
		this._fsp = options.fsp;

		this._latestLogOrSnapshotNo = undefined;
		this.eventlog = [];
	}

	getLatestFileNo(files, ext) {
		return files
			.map(file => path.parse(file))
			.filter(fi => fi.ext == ext && !isNaN(fi.name))
			.map(fi => parseInt(fi.name, 10))
			.reduce((max, num) => num > max ? num : max, 0);
	}

	camelToPascalCase(camelcaseString) {
		return camelcaseString[0].toUpperCase() + camelcaseString.substring(1);
	}

	async init() {
		if (!this.instance) this.instance = this.createModelCallback(this.dispatch.bind(this), this.configureStore.bind(this));

		let files = await this._fsp.readdir(this.folder);
		let latestSnapshotNo = this.getLatestFileNo(files, `.${this.modelname}-snapshot`);
		let latestLogNo = this.getLatestFileNo(files, ".log");
		this._latestLogOrSnapshotNo = Math.max(latestSnapshotNo, latestLogNo)

		if (latestSnapshotNo) {
			await this.restoreSnapshot(latestSnapshotNo);
		}
		await this.replay(latestSnapshotNo + 1, latestLogNo);
	}

	configureStore(config){
		this._snapshothandlers = {
			createSnapshotData:() => config.createSnapshotData(),
			restoreFromSnapshot: snapshotContents => config.restoreFromSnapshot(snapshotContents),
		}

		this._eventhandlers = config.eventhandlers;

		this._fallbackEventhandler = config.fallbackEventhandler || (() => undefined);
	}

	async restoreSnapshot(snapshotNo) {
		if (this._snapshothandlers === undefined) throw new Error(`Can't restore snapshot. Missing snapshothandler for "${this.modelname}".`);

		let snapshotfile = path.resolve(this.folder, snapshotNo + `.${this.modelname}-snapshot`);
		// console.log("Reading snapshot file:", snapshotfile);

		let file = await this._fsp.readFile(snapshotfile);
		let snapshotContents = JSON.parse(file.toString());
		this._snapshothandlers.restoreFromSnapshot(snapshotContents.snapshot);
		// return {metadata: snapshotContents.metadata, customMetadata: snapshotContents.customMetadata}; // would this be usefull to anyone?
	}

	async replay(fromLogNo, toLogNo, stopReplayPredicates) {
		for (let logNo = fromLogNo; logNo <= toLogNo; logNo++) {
			let logfile = path.resolve(this.folder, logNo + ".log");
			// console.log("Reading log file:", logfile);

			let file = await this._fsp.readFile(logfile);
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
		let eventhandler = this._eventhandlers[eventhandlername] || this._fallbackEventhandler;

		// TODO: should a RW model have ALL commandhandlers?
		// if (!options.requireAllEventsToBeHandled || eventhandler !== undefined) {
		// 	throw new Error(`Cannot handle event while all events are required to be handled. Can't find "${eventhandlername}" eventhandler. Consider setting options.requireAllEventsToBeHandled = false.`);
		// }

		eventhandler(event);
	}

	dispatch(eventname, event) {
		this.eventlog.push({
			eventname,
			event
		});
		this.handleEvent(eventname, event);
	}

	async save() {
		if (this.eventlog && this.eventlog.length) {
			let metadata = this._metadataCallback();

			let logfile = path.resolve(this.folder, ++this._latestLogOrSnapshotNo + ".log");
			await this._fsp.appendFile(logfile, JSON.stringify({ metadata, events: this.eventlog}), {
				flag: "wx"
			});

			this.eventlog = [];
		}
	}

	async snapshot(snapshotMetadata) {
		if (!this.instance) await this.init();

		let metadata = this._metadataCallback();

		let state = { metadata, snapshotMetadata, snapshot: this._snapshothandlers.createSnapshotData() };
		let snapshotfile = path.resolve(this.folder, this._latestLogOrSnapshotNo + `.${this.modelname}-snapshot`);
		await this._fsp.appendFile(snapshotfile, JSON.stringify(state), {
			flag: "w"
		});
	}
}

module.exports = Store;