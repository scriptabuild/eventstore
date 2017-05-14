const path = require("path");
const awaitableFs = require("./awaitableFs");



// // example of how to use...
// let options = { console, fs, createHeaders};
// let evs = new EventStore("folder", options);
// evs.replayEventStream(event => 'what to do with event?');
// evs.replayEventStream(event => 'what to do with event?', stopReplayPredicates);
// evs.logEvent(eventObj);
// evs.logEvents((store, markAsComplete) => {
// 	store.logEvent(eventObj);
// 	markAsComplete();
// });
// // end of example



module.exports = class EventStore {
	constructor(folder, options) {
		this.folder = folder;

		this._createHeaders = options.createHeaders || (() => ({time: new Date().toISOString()}));
		this._fs = options.fs || awaitableFs;
		this._console = options.console;
	}

	getLatestFileNo(files, ext) {
		return files
			.map(file => path.parse(file))
			.filter(fi => fi.ext == ext && !isNaN(fi.name))
			.map(fi => parseInt(fi.name, 10))
			.reduce((max, num) => num > max ? num : max, 0);
	}

	async getLatestLogFileNo(){
		let allFiles = await this.getAllFilenames();
		return this.getLatestFileNo(allFiles, ".log");
	}

	async getAllFilenames(folder){
		return await this._fs.readdir(folder);
	}

	async replayEventStream(handleEvent = () => {}, fileNos = {}, stopReplayPredicates = {}){
		let stopBeforeApply = stopReplayPredicates.stopBeforeApply || (() => true);
		let stopAfterApply = stopReplayPredicates.stopAfterApply || (() => true);

		let fromFileNo = fileNos.fromFileNo || 0;
		let toFileNo = fileNos.toFileNo || await this.getLatestlogFileNo();

		for (let fileNo = fromFileNo || 0; fileNo <= toFileNo; fileNo++) {
			let fileName = path.resolve(this.folder, fileNo + ".log");
			this._console.log("Reading log file:", fileName);

			let fileObj = await this._fs.readFile(fileName);
			let contents = JSON.parse(fileObj.toString());
			
			if (stopBeforeApply(contents, fileNo, fileName)) {
				break;
			}

			let headers = contents.headers;
			let events = contents.events;
			events.forEach(event => {
				handleEvent(event, headers);
			});

			if (stopAfterApply(contents, fileNo, fileName)) {
				break;
			}
		}
	}

	async logEvent(eventObj, fileNo = undefined){
		return this.logEvents((log, markAsComplete) => {
			log(eventObj);
			markAsComplete();
		}, fileNo);
	}

	async logEvents(action, fileNo = undefined){
		let events = [];
		let log = (event) => {
			events.push(event);
		};
		let isComplete = false;
		let markAsComplete = () => {
			isComplete = true;
		}
		
		await action(log, markAsComplete);

		if(isComplete){
			fileNo = fileNo || await this.getLatestLogFileNo();
			await this.save(events, fileNo);
		}
	}

	async save(events, fileNo) {
		if (events && events.length) {
			let headers = this._createHeaders();

			let logfile = path.resolve(this.folder, ++fileNo + ".log");
			await this._fs.appendFile(logfile, JSON.stringify({headers, events}), {flag: "wx"});
		}
	}
}
