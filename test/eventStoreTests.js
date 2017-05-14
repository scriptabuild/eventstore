const {suite, setup, test} = require("mocha");
const assert = require("assert");

const EventStore = require("../source/EventStore");
const FakeAwaitableFs = require("./FakeAwaitableFs");

suite("new EventStore(folder, options)", function () {

	let fs;
	let eventStore;

	setup(async function () {
		fs = new FakeAwaitableFs();
		eventStore = new EventStore("not-a-real-folder", {fs});
	});



	suite(".log(eventObj, fileNo)", function () {

		test("creates \"1.log\" file for first invokation", async function () {
			await eventStore.log({name: "first event"});

			assert.ok(fs.files["1.log"]);
		});

		test("creates \"2.log\" file for second invokation", async function () {
			await eventStore.log({name: "first event"});
			await eventStore.log({name: "second event"});

			assert.ok(fs.files["2.log"]);
		});

		test("creates exactly one file for one invocation", async function () {
			await eventStore.log({name: "first event"});

			assert.equal(Object.keys(fs.files).length, 1);
		});

		test("creates exactly two files for two invocations", async function () {
			await eventStore.log({name: "first event"});
			await eventStore.log({name: "second event"});

			assert.equal(Object.keys(fs.files).length, 2);
		});

		test("stores the event in file", async function () {
			await eventStore.log({name: "test event"});

			let logged = JSON.parse(fs.files["1.log"]);
			assert.equal(logged.events[0].name, "test event");
		});

		test("stores headers in file", async function () {
			await eventStore.log({name: "test event"});

			let logged = JSON.parse(fs.files["1.log"]);
			assert.ok(logged.headers);
		});

	});



	suite(".logBlock(action, fileNo)", function () {

		test("doesn't create any file when batch hasn't reported markAsComplete()", async function () {
			await eventStore.logBlock(log => {
				log({name: "first event"});
				log({name: "second event"});
				// No markAsComplete() here!!!
			});

			assert.equal(Object.keys(fs.files).length, 0);
		});

		test("doesn't create any file when batch doesn't log anything", async function () {
			await eventStore.logBlock((log, markAsComplete) => {
				// No events are logged here!!!
				markAsComplete();
			});

			assert.equal(Object.keys(fs.files).length, 0);
		});

		test("creates \"1.log\" file for first invokation", async function () {
			await eventStore.logBlock((log, markAsComplete) => {
				log({name: "first event"});
				log({name: "second event"});
				markAsComplete();
			});

			assert.ok(fs.files["1.log"]);
		});

		test("creates \"2.log\" file for second invokation", async function () {
			await eventStore.logBlock((log, markAsComplete) => {
				log({name: "first event"});
				log({name: "second event"});
				markAsComplete();
			});
			await eventStore.logBlock((log, markAsComplete) => {
				log({name: "third event"});
				log({name: "fourth event"});
				markAsComplete();
			});

			assert.ok(fs.files["2.log"]);
		});

		test("can store multiple events in a single file", async function () {
			await eventStore.logBlock((log, markAsComplete) => {
				log({name: "first event"});
				log({name: "second event"});
				markAsComplete();
			});

			let logged = JSON.parse(fs.files["1.log"]);
			assert.equal(logged.events.length, 2);
		});

	});



	suite(".replayEventStream(handleEvent, fileRange, stopReplayPredicates)", function () {

		test("replay one event from one file", async function () {
			fs.files = {
				"1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "first event"
						}]
					}`
			};

			let fulfilled = false;
			await eventStore.replayEventStream((event, headers) => {
				assert.equal(event.name, "first event");
				fulfilled = true;
			});
			assert.ok(fulfilled, "Async function wasn't called");
		});

		test("replay two events from one file", async function () {
			fs.files = {
				"1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "first event"
						},{
							"name": "second event"
						}]
					}`
			};

			let fulfilledCount = 0;
			await eventStore.replayEventStream((event, headers) => {
				fulfilledCount++;
			});
			assert.equal(fulfilledCount, 2);
		});

		test("replay two events from two files", async function () {
			fs.files = {
				"1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.995Z"
						},
						"events": [{
							"name": "first event"
						}]
					}`,
				"2.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "second event"
						}]
					}`

			};

			let fulfilledCount = 0;
			await eventStore.replayEventStream((event, headers) => {
				fulfilledCount++;
			});
			assert.equal(fulfilledCount, 2);
		});

	});
});


