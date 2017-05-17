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

		store = await defineStore("not-a-folder", {
			fs
		});
	});



	suite(".defineReadModel(...)", function () {

		suite(".withReadModel(action)", function () {

			test("create readmodel from one log file", async function () {
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
				await readmodel.withReadModel(model =>{
					// TODO: read from the readdmodel and ASSERT that some value is correct.
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});

			test("create readmodel from two log files", async function () {
				fs.files = {
					"1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.990Z"
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

				let fulfilled = false;
				await readmodel.withReadModel(model =>{
					// TODO: read from the readdmodel and ASSERT that some value is correct.
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});

			test("create readmodel from a snapshot file", async function () {
				fs.files = {
					"1.some-snapshot": `
					{
						...
					}`
				};

				let fulfilled = false;
				await readmodel.withReadModel(model =>{
					// TODO: read from the readdmodel and ASSERT that some value is correct.
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});

			test("create readmodel from a snapshot file and one log file", async function () {
				fs.files = {
					"1.some-snapshot": `
					{
						...
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

				let fulfilled = false;
				await readmodel.withReadModel(model =>{
					// TODO: read from the readdmodel and ASSERT that some value is correct.
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});
		});

		suite(".snapshot(...)", function () {

			test("create snapshot from one log file", async function () {
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

				await readmodel.snapshot();
				assert.ok(fs.files["1.some-snapshot"]);
			});

			test("create snapshot from two log files", async function () {
				fs.files = {
					"1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.990Z"
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

				await readmodel.snapshot();
				assert.ok(fs.files["2.some-snapshot"]);
			});

			test("create snapshot from a snapshot file and one log file", async function () {
				fs.files = {
					"1.some-snapshot": `
					{
						...
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

				await readmodel.snapshot();
				assert.ok(fs.files["2.some-snapshot"]);
			});

		});

	});
});