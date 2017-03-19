const fsp = require("fs-promise");
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

function Store(folder, createInstance, stopReplayAfterPredicate = (filename, events, instance) => false) {

	let instance = undefined;

	let eventhandlers = undefined;
	let snapshothandlers = undefined;

	let latestLogOrSnapshotNo = undefined;
	let eventlog = [];



	// private methods

	function registerEventhandlers(newEventhandlers) {
		eventhandlers = newEventhandlers
	};

	function registerSnapshothandlers(newSnapshothandlers) {
		snapshothandlers = newSnapshothandlers
	};

	async function restore(snapshotNo) {
		if (snapshothandlers, snapshotNo) {
			let snapshotfile = path.resolve(folder, snapshotNo + ".snapshot");
			console.log("Reading snapshot file:", snapshotfile);

			let file = await fsp.readFile(snapshotfile);
			let snapshotContents = JSON.parse(file.toString());
			snapshothandlers.restoreFromSnapshot(snapshotContents);
		}
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

			if (stopReplayAfterPredicate && stopReplayAfterPredicate(logfile, events, instance))
				break;
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
		}
		catch(err){
			console.error(err);
		}
	}

	// public methods

	this.init = async() => {
		if (!instance) instance = createInstance(dispatch, registerEventhandlers, registerSnapshothandlers);

		let files = await fsp.readdir(folder);
		let latestSnapshotNo = getLatestFileNo(files, ".snapshot");
		let latestLogNo = getLatestFileNo(files, ".log");
		latestLogOrSnapshotNo = Math.max(latestSnapshotNo, latestLogNo)

		await restore(latestSnapshotNo);
		await replay(latestSnapshotNo + 1, latestLogNo);
	}

	this.snapshot = async() => {
		if (!instance) init();

		let state = snapshothandlers.createSnapshotData();

		let snapshotfile = path.resolve(folder, latestLogOrSnapshotNo + ".snapshot");
		await fsp.appendFile(snapshotfile, JSON.stringify(state), {
			flag: "w"
		});
	}

	this.withRetries = async(action, maxRetries = 5) => {
		let isCancelled = false;

		let retryCount = 0;
		while (retryCount < maxRetries) {
			if (!instance) await this.init();

			action(instance, () => {
				isCancelled = true;
			});
			if (isCancelled) {
				instance = undefined;
				eventlog = [];
				return this;
			} else {
				try {
					await save();
					return this;
				} catch (err) {
					retryCount++;
				}
			}
		}
		throw new Error("Failed the max number of retries. Aborting and rolling back action.");
	}
}




async function ensureFolder(folder) {
	try {
		await fsp.mkdir(folder);
	} catch (err) {
		if (err.code != 'EEXIST') throw err;
	}
}

// external surface of Store
// Parameter "folder": folder to store logs and snapshots to
// Parameter "createInstance": creator function, signature: (dispatch, registerEventhandler, registerSnapshothandler)

const initStore = async(folder, createInstance, stopReplayAfterPredicate) => {
	await ensureFolder(folder);
	let underlyingStore = new Store(folder, createInstance, stopReplayAfterPredicate);
	await underlyingStore.init();
	return underlyingStore;
};

module.exports = initStore;