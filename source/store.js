const fs = require("fs");
const path = require("path");

// helper functions

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


// constructor function

function Store(folder, createInstance) {

	let instance = undefined;

	let eventhandlers = undefined;
	let snapshothandlers = undefined;

	let latestLogOrSnapshotNo = undefined;
	let eventlog = [];

	init();

	// private methods

	function registerEventhandlers(newEventhandlers) {
		eventhandlers = newEventhandlers
	};

	function registerSnapshothandlers(newSnapshothandlers) {
		snapshothandlers = newSnapshothandlers
	};

	function init() {
		if (!instance) instance = createInstance(dispatch, registerEventhandlers, registerSnapshothandlers);

		let files = fs.readdirSync(folder);
		let latestSnapshotNo = getLatestFileNo(files, ".snapshot");
		let latestLogNo = getLatestFileNo(files, ".log");
		latestLogOrSnapshotNo = Math.max(latestSnapshotNo, latestLogNo)

		restore(latestSnapshotNo);
		replay(latestSnapshotNo + 1, latestLogNo);
	}

	function restore(snapshotNo) {
		if (snapshothandlers, snapshotNo) {
			let snapshotfile = path.resolve(folder, snapshotNo + ".snapshot");
			console.log("Reading snapshot file:", snapshotfile)
			let snapshotContents = JSON.parse(fs.readFileSync(snapshotfile).toString());
			snapshothandlers.restoreFromSnapshot(snapshotContents);
		}
	}

	function replay(fromLogNo, toLogNo) {
		for (let logNo = fromLogNo; logNo <= toLogNo; logNo++) {
			let logfile = path.resolve(folder, logNo + ".log");
			console.log("Reading log file:", logfile);

			let events = JSON.parse(fs.readFileSync(logfile).toString());

			events.forEach(eventEntry => {
				handleEvent(eventEntry.eventname, eventEntry.event);
			});
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

	function save() {
		if (eventlog && eventlog.length) {
			let logfile = path.resolve(folder, ++latestLogOrSnapshotNo + ".log");
			fs.appendFileSync(logfile, JSON.stringify(eventlog), {
				flag: "wx"
			});

			eventlog = [];
		}
	}

	// public methods

	this.snapshot = () => {
		if (!instance) init();

		let state = snapshothandlers.createSnapshotData();

		let snapshotfile = path.resolve(folder, latestLogOrSnapshotNo + ".snapshot");
		fs.appendFileSync(snapshotfile, JSON.stringify(state), {
			flag: "w"
		});
	}

	this.withRetries = (action, maxRetries = 5) => {
		let isCancelled = false;

		let retryCount = 0;
		while(retryCount < maxRetries) {
			if (!instance) init();

			action(instance, () => {
				isCancelled = true;
			});
			if (isCancelled) {
				instance = undefined;
				eventlog = [];			
				return this;
			} else {
				try {
					save();
					return this;
				} catch (err) {
					retryCount++;
				}
			}
		}
		throw new Error("Failed the max number of retries. Aborting and rolling back action.");
	}
}


// external surface of Store
// Parameter "folder": folder to store logs and snapshots to
// Parameter "createInstance": creator function, signature: (dispatch, registerEventhandler, registerSnapshothandler)
const initStore = (folder, createInstance) => {
	let underlyingStore = new Store(folder, createInstance);
	return underlyingStore;
};

module.exports = initStore;
