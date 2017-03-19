const assert = require("assert");
const path = require("path");
const initStore = require("../source/store.js");
const Contactlist = require("./ContactList");

const folder = path.resolve(__dirname, "../temp");

// TODO: remove folder before running tests
(async function() {

	const createContactlistFn = (dispatch, reh, rsh) => new Contactlist(dispatch, reh, rsh);
	const stopReplayPredicate = (filename, events, instance) => (filename.endsWith("1.log"));
	let store = await initStore(folder, createContactlistFn /*, stopReplayPredicate*/ );

	// TODO: check folder is created, but is empty

	await store.withRetries((contactlist, rollback) =>  {
		contactlist.addContact({
			name: "Mickey Mouse",
			city: "Duckburgh",
			species: "Mouse"
		});
		contactlist.addContact({
			name: "Goofey",
			city: "Duckburgh",
			species: "Dog"
		});
	});

	// TODO: check that contactlist contains exactly two contacts: mickey & goofey
	// TODO: check that folder holds exactly one file: 1.log

	await store.withRetries((contactlist, rollback) =>  {
		contactlist.addContact({
			name: "Peter Pan",
			city: "Never Never Land",
			species: "Boy"
		});
		contactlist.removeContact("Goofey");
		rollback();
	});

	// TODO: check that contactlist still contains exactly two contacts: mickey & goofey
	// TODO: check that folder still holds exactly one file: 1.log

	await store.withRetries((contactlist, rollback) =>  {
		contactlist.addContact({
			name: "Donald Duck",
			city: "Duckburgh",
			species: "Duck"
		});
		contactlist.removeContact("Goofey");
	});

	// TODO: check that contactlist contains exactly two contacts: mickey & donald
	// TODO: check that folder holds exactly two files: 1.log, 2.log

	await store.snapshot();

	await store.withRetries(contactlist => {
		contactlist.getAllContacts().forEach(contact => console.log(contact));
	});
	// TODO: assert folder holds exactly three files: 1.log, 2.log, 3.log




	// TODO: create same stores twice to test concurrency
	// TODO: create another store to test replaying of logs
	// TODO: create another store to test restoring a snapshot
	// TODO: create another store and delete old logs to test restore snapshot
	// TODO: create another store to test restore snapshot with playback of additional logs
	// TODO: remove a log to test that replay fails
	// TODO: replay to stop point, using lambda -> by file time, by filename, by state of contactlist object
})();