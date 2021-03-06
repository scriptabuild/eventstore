const path = require("path");
const awaitableFs = require("./AwaitableFs");



module.exports = class EventStore {
	constructor(folder, options) {
		this.folder = folder;

		this._createHeaders = options.createHeaders || (() => ({time: new Date().toISOString()}));
		this._fs = options.fs || awaitableFs;
		this._console = options.console || {log(){}};
	}

	getLatestFileNo(files, ext) {
		return files
			.map(file => path.parse(file))
			.filter(fi => fi.ext == ext && !isNaN(fi.name))
			.map(fi => parseInt(fi.name, 10))
			.reduce((max, num) => num > max ? num : max, 0);
	}

	async getAllFilenames(folder) {
		try{
			let filenames = await this._fs.readdir(folder);
			return filenames || [];
		} catch(err) {
			if(err.code === "ENOENT"){
				return [];
			}
		}
	}

	// snapshot stuff

	async getLatestSnapshotFileNo(snapshotName) {
		let allFiles = await this.getAllFilenames(this.folder);
		return this.getLatestFileNo(allFiles, `.${snapshotName}-snapshot`);
	}

	async restoreSnapshot(snapshotFileNo, snapshotName){
		let filename = path.resolve(this.folder, `${snapshotFileNo}.${snapshotName}-snapshot`);
		let fileObj = await this._fs.readFile(filename);
		let contents = JSON.parse(fileObj.toString());
		return contents.snapshot;
	}

	async saveSnapshot(snapshot, modelName, fileNo){
		let headers = this._createHeaders();

		let snapshotFilename = path.resolve(this.folder, `${fileNo}.${modelName}-snapshot`);
		await this._fs.appendFile(snapshotFilename, JSON.stringify({headers, snapshot}), {flag: "wx"});
	}


	// eventlog stuff

	async getLatestLogFileNo() {
		let allFiles = await this.getAllFilenames(this.folder);
		return this.getLatestFileNo(allFiles, ".log");
	}

	async replayEventStream(handleEvent = () => {}, fileRange = {}, stopReplayPredicates = {}) {
		let stopBeforeApply = stopReplayPredicates.stopBeforeApply || (() => false);
		let stopAfterApply = stopReplayPredicates.stopAfterApply || (() => false);

		let from = fileRange.from || 1;
		let to = fileRange.to || await this.getLatestLogFileNo();

		for (let fileNo = from; fileNo <= to; fileNo++) {
			let filename = path.resolve(this.folder, fileNo + ".log");
			this._console.log("Reading log file:", filename);

			let fileObj = await this._fs.readFile(filename);
			let contents = JSON.parse(fileObj.toString());
			
			if (stopBeforeApply(contents, fileNo, filename)) {
				break;
			}

			let headers = contents.headers;
			let events = contents.events;
			events.forEach(event => {
				handleEvent(event, headers);
			});

			if (stopAfterApply(contents, fileNo, filename)) {
				break;
			}
		}
	}

	async log(eventObj, fileNo = undefined) {
		return this.logBlock((log, markAsComplete) => {
			log(eventObj);
			markAsComplete();
		}, fileNo);
	}

	async logBlock(action, fileNo = undefined) {
		let events = [];
		let log = (event) => {
			events.push(event);
		};
		let isComplete = false;
		let markAsComplete = () => {
			isComplete = true;
		}
		
		await action(log, markAsComplete);

		if(isComplete) {
			fileNo = fileNo || (await this.getLatestLogFileNo() + 1);
			await this.saveEvents(events, fileNo);
		}
	}

	async saveEvents(events, fileNo = undefined) {
		if (events && events.length) {
			let headers = this._createHeaders();

			let logfile = path.resolve(this.folder, fileNo + ".log");
			await this._fs.appendFile(logfile, JSON.stringify({headers, events}), {flag: "wx"});
		}
	}

}
