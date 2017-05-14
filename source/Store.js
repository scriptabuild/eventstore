const path = require("path");
const camelToPascalCase = require("./camelToPascalCase");


module.exports = class Store {
	constructor(folder, modelname, createModelCallback, options) {
		this.folder = folder;
		this.modelname = modelname;
		this.createModelCallback = createModelCallback;

		this.instance = undefined;

		// this._createSnapshotData = undefined;
		// this._restoreFromSnapshot = undefined;
		this._eventhandlers = undefined;
		this._fallbackEventhandler = undefined;

		this._createHeaders = options.createHeaders;
		this._fs = options.fs;
		this._console = options.console;

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

	async init() {
		if (!this.instance) this.instance = this.createModelCallback(this.dispatch.bind(this), this.configureStore.bind(this));

		let files = await this._fs.readdir(this.folder);

		let latestSnapshotNo = 0;	//this.getLatestFileNo(files, `.${this.modelname}-snapshot`);
		let latestLogNo = this.getLatestFileNo(files, ".log");
		let startFromNo = (this._latestLogOrSnapshotNo || 0) + 1;
		this._latestLogOrSnapshotNo = Math.max(latestSnapshotNo, latestLogNo)
		
		// if (latestSnapshotNo > startFromNo) {
		// 	await this.restoreSnapshot(latestSnapshotNo);
		// 	await this.replay(latestSnapshotNo + 1, latestLogNo);
		// } else {
			await this.replay(startFromNo, latestLogNo);
		// }
	}

	configureStore(config) {
		// this._createSnapshotData = () => config.createSnapshotData();
		// this._restoreFromSnapshot = snapshotContents => config.restoreFromSnapshot(snapshotContents);

		this._eventhandlers = config.eventhandlers || {};

		this._fallbackEventhandler = config.fallbackEventhandler || (() => undefined);
	}

	// async restoreSnapshot(snapshotNo) {
	// 	if (this._restoreFromSnapshot === undefined) throw new Error(`Can't restore snapshot. Missing snapshothandler for "${this.modelname}".`);

	// 	let snapshotfile = path.resolve(this.folder, snapshotNo + `.${this.modelname}-snapshot`);
	// 	this._console.log("Reading snapshot file:", snapshotfile);

	// 	let file = await this._fs.readFile(snapshotfile);
	// 	let snapshotContents = JSON.parse(file.toString());
	// 	this._restoreFromSnapshot(snapshotContents.snapshot);
	// }

	async replay(fromLogNo, toLogNo, stopReplayPredicates) {
		for (let logNo = fromLogNo; logNo <= toLogNo; logNo++) {
			let logfile = path.resolve(this.folder, logNo + ".log");
			this._console.log("Reading log file:", logfile);

			let file = await this._fs.readFile(logfile);
			let logfileContents = JSON.parse(file.toString());
			
			if (stopReplayPredicates && stopReplayPredicates.BeforeApply && stopReplayPredicates.BeforeApply(file, logfileContents, this.instance)) {
				break;
			}

			let events = logfileContents.events;
			events.forEach(event => {
				this.handleEvent(event.eventname, event.eventdata, logfileContents.headers);
			});

			if (stopReplayPredicates && stopReplayPredicates.AfterApply && stopReplayPredicates.AfterApply(file, logfileContents, this.instance)) {
				break;
			}
		}
	}

	handleEvent(eventname, eventdata, headers) {
		let eventhandlername = "on" + camelToPascalCase(eventname);
		let eventhandler = this._eventhandlers[eventhandlername];

		if (eventhandler) {
			eventhandler(eventdata, headers);
		} else {
			this._fallbackEventhandler(eventname, eventdata, headers);
		}
	}

	dispatch(eventname, eventdata) {
		this.eventlog.push({
			eventname,
			eventdata
		});
		this.handleEvent(eventname, eventdata);
	}

	async save() {
		if (this.eventlog && this.eventlog.length) {
			let headers = this._createHeaders();

			let logfile = path.resolve(this.folder, ++this._latestLogOrSnapshotNo + ".log");
			await this._fs.appendFile(logfile, JSON.stringify({
				headers,
				events: this.eventlog
			}), {
				flag: "wx"
			});

			this.eventlog = [];
		}
	}

	// async snapshot(snapshotMetadata) {
	// 	// if (!this.instance)
	// 	await this.init();

	// 	let headers = this._createHeaders();

	// 	let state = {
	// 		headers,
	// 		snapshotMetadata,
	// 		snapshot: this._createSnapshotData()
	// 	};

	// 	let snapshotfile = path.resolve(this.folder, this._latestLogOrSnapshotNo + `.${this.modelname}-snapshot`);
	// 	await this._fs.appendFile(snapshotfile, JSON.stringify(state), {
	// 		flag: "w"
	// 	});
	// }
}
