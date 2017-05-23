const {suite, setup, test} = require("mocha");
const assert = require("assert");

// const EventStore = require("../source/EventStore");
const defineStore = require("../source/defineStore");
const FakeAwaitableFs = require("./FakeAwaitableFs");

suite("defineStore(folder, options)", function () {

	let fs;
	let store;
	let readModel;
	let readModelDefinition = {
		areSnapshotsEnabled: true,
		snapshotName: "some-snapshot",
		createSnapshot(model){
			return model;
		},
		initializeModel(){
			return {
				members:[]
			};
		},
		eventHandlers: {
			onMemberAdded: model => (eventdata, headers) => {
				if(model.members.indexOf(item => item.firstname === eventdata.firstname && item.lastname === eventdata.firstname) !== -1){
					throw new Error("Can't add member. Person is already member.")
				}
				model.members.push(eventdata);
			}
		}
		// ,
		// fallbackEventHandler(eventname, eventdata, headers){
		// 	// console.log("*** defualt eventhandler", eventname, eventdata, headers)
		// }
	}

	setup(async function () {
		fs = new FakeAwaitableFs();

		store = await defineStore("not-a-folder", {fs});
		readModel = store.defineReadModel(readModelDefinition);
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
							"name": "memberAdded",
							"data": {
								"firstname": "arjan",
								"lastname": "einbu"
							}
						}]
					}`
				};

				let fulfilled = false;
				await readModel.withReadModel(model => {
					assert.deepEqual(model.members[0], {firstname: "arjan", lastname: "einbu"});
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
							"name": "memberAdded",
							"data": {
								"firstname": "arjan",
								"lastname": "einbu"
							}
						}]
					}`,
					"2.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "memberAdded",
							"data": {
								"firstname": "marit",
								"lastname": "winge"
							}
						}]
					}`
				};

				let fulfilled = false;
				await readModel.withReadModel(model =>{
					// TODO: read from the readdmodel and ASSERT that some value is correct.
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});

			test("create readmodel from a snapshot file", async function () {
				fs.files = {
					"1.some-snapshot": `
					{
						"members": [
							{"firstname": "arjan", "lastname": "einbu"},
							{"firstname": "marit", "lastname": "winge"}
						]
					}`
				};

				let fulfilled = false;
				await readModel.withReadModel(model =>{
					// TODO: read from the readdmodel and ASSERT that some value is correct.
					assert.deepEqual(model.members, [{firstname: "arjan", lastname: "einbu"}, {firstname: "marit", lastname: "winge"}]);
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

				await readModel.snapshot();
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

				await readModel.snapshot();
				assert.ok(fs.files["2.some-snapshot"]);
			});

		});

	});
});