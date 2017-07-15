const {suite, setup, test} = require("mocha");
const assert = require("assert");

// const EventStore = require("../source/EventStore");
const defineStore = require("../source/defineStore");
const FakeAwaitableFs = require("./FakeAwaitableFs");

suite("defineStore(folder, options)", function () {

	let fs;
	let store;

	setup(async function () {
		fs = new FakeAwaitableFs();

		store = await defineStore("/not-a-real-folder", {
			fs
		});
	});



	suite(".log(eventObj)", function () {

		test("Log event, creates first file", async function () {
			fs.files = {};
			await store.log({
				name: "first event"
			});

			assert.equal(Object.keys(fs.files).length, 1);
			assert.ok(fs.files["/not-a-real-folder/1.log"]);
		});

		test("Log event when files exist, creates another file in correct sequence", async function () {
			fs.files = {
				"/not-a-real-folder/1.log": `
				{"headers": {"time": "2016-12-31T23:59:59.999Z"},
				"events": [{"name": "first event"}]
			`
			};

			await store.log({
				name: "second event"
			});

			assert.equal(Object.keys(fs.files).length, 2);
			assert.ok(fs.files["/not-a-real-folder/2.log"]);
		});

	});



	suite(".logBlock(action)", function () {

		test("First event batch, creates first file", async function () {
			fs.files = {};
			await store.logBlock((log, markAsComplete) => {
				log({
					name: "first event"
				});
				log({
					name: "second event"
				});
				markAsComplete();
			});

			assert.equal(Object.keys(fs.files).length, 1);
			assert.ok(fs.files["/not-a-real-folder/1.log"]);
		});

		test("Second event batch, creates second file", async function () {
			fs.files = {
				"/not-a-real-folder/1.log": `
				{"headers": {"time": "2016-12-31T23:59:59.999Z"},
				"events": [{"name": "first event"}, {"name": "second event"}]
			`
			};

			await store.logBlock((log, markAsComplete) => {
				log({
					name: "third event"
				});
				log({
					name: "fourth event"
				});
				markAsComplete();
			});

			assert.equal(Object.keys(fs.files).length, 2);
			assert.ok(fs.files["/not-a-real-folder/2.log"]);
		});

	});



	suite(".replayEventStream(handleEvent)", function () {

		test("replay one event from one file", async function () {
			fs.files = {
				"/not-a-real-folder/1.log": `
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
			await store.replayEventStream((event, headers) => {
				assert.equal(event.name, "first event");
				fulfilled = true;
			});
			assert.ok(fulfilled, "Async function wasn't called");
		});

		test("Replay from two files", async function () {
			fs.files = {
				"/not-a-real-folder/1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.995Z"
						},
						"events": [{
							"name": "first event"
						}]
					}`,
				"/not-a-real-folder/2.log": `
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
			await store.replayEventStream((event, headers) => {
				fulfilledCount++;
			});
			assert.equal(fulfilledCount, 2);
		});

	});
});