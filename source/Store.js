const path = require("path");
const camelToPascalCase = require("./camelToPascalCase");


module.exports = class Store {
	constructor(folder, modelname, createModelCallback, options) {
		this.folder = folder;
		this.modelname = modelname;
		this.createModelCallback = createModelCallback;

		this.instance = undefined;

		this._eventhandlers = undefined;
		this._fallbackEventhandler = undefined;

		this._createHeaders = options.createHeaders;
		this._fs = options.fs;
		this._console = options.console;

		this._latestFileNo = undefined;
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
		
		let latestLogNo = this.getLatestFileNo(files, ".log");
		let startFromNo = (this._latestFileNo || 0) + 1;
		this._latestFileNo = latestLogNo;
		
		await this.replay(startFromNo, latestLogNo);
	}

	configureStore(config) {
		this._eventhandlers = config.eventhandlers || {};
		this._fallbackEventhandler = config.fallbackEventhandler || (() => undefined);
	}


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

			let logfile = path.resolve(this.folder, ++this._latestFileNo + ".log");
			await this._fs.appendFile(logfile, JSON.stringify({
				headers,
				events: this.eventlog
			}), {
				flag: "wx"
			});

			this.eventlog = [];
		}
	}

}
