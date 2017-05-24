const {suite, setup, test} = require("mocha");
const assert = require("assert");

const defineStore = require("../source/defineStore");
const FakeAwaitableFs = require("./FakeAwaitableFs");

suite("defineStore(folder, options)", function () {

	let fs;
	let store;
	let model;
	let modelDefinition = {
		areSnapshotsEnabled: true,
		snapshotName: "some-model",
		createSnapshot(model){
			return model;
		},
		initializeModel(){
			return {
				members:[]
			};
		},
		eventHandlers: {
			onMemberAdded: instance => (eventdata, headers) => {
				if(instance.members.indexOf(item => item.firstname === eventdata.firstname && item.lastname === eventdata.firstname) !== -1){
					throw new Error("Can't add member. Person is already member.")
				}
				instance.members.push(eventdata);
			}
		}
	}

	setup(async function () {
		fs = new FakeAwaitableFs();

		store = await defineStore("not-a-folder", {fs});
		model = store.defineModel(modelDefinition);
	});



	suite(".defineModel(modelDefinition)", function () {

		suite(".withReadInstance(action)", function () {

			test("create read only instance from one log file", async function () {
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
				await model.withReadInstance(instance => {
					assert.deepEqual(instance.members[0], {firstname: "arjan", lastname: "einbu"});
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});

			test("create read only instance from two log files", async function () {
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
				await model.withReadInstance(instance =>{
					assert.deepEqual(instance.members, [{firstname: "arjan", lastname: "einbu"}, {firstname: "marit", lastname: "winge"}]);
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});

			test("create read only instance from a snapshot file", async function () {
				fs.files = {
					"1.some-model-snapshot": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.000Z"
						},
						"snapshot":{
							"members": [
								{"firstname": "arjan", "lastname": "einbu"},
								{"firstname": "marit", "lastname": "winge"}
							]
						}
					}`
				};

				let fulfilled = false;
				await model.withReadInstance(instance => {
					assert.deepEqual(instance.members, [{firstname: "arjan", lastname: "einbu"}, {firstname: "marit", lastname: "winge"}]);
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});

			test("create readmodel from a snapshot file and one log file", async function () {
				fs.files = {
					"1.some-model-snapshot": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.000Z"
						},
						"snapshot":{
							"members": [
								{"firstname": "arjan", "lastname": "einbu"},
								{"firstname": "marit", "lastname": "winge"}
							]
						}
					}`,
					"2.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "memberAdded",
							"data": {
								"firstname": "peter",
								"lastname": "pan"
							}
						}]
					}`
				};

				let fulfilled = false;
				await model.withReadInstance(instance => {
					assert.deepEqual(instance.members, [{firstname: "arjan", lastname: "einbu"}, {firstname: "marit", lastname: "winge"}, {firstname: "peter", lastname: "pan"}]);
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});
		});



		suite(".withReadWriteInstance(action)", async function(){

			test("create a .log file when transaction is marked as ready to commit", async function(){
				await model.withReadWriteInstance((instance, readyToCommit) => {
					instance.addMember({firstname: "arjan", lastname: "einbu"});
					readyToCommit();
				});
				assert.fail("not implemented yet");
			});

			test("dont create a .log file when transaction isn't marked as ready to commit", async function(){
				await model.withReadWriteInstance((instance, readyToCommit) => {
					instance.addMember({firstname: "arjan", lastname: "einbu"});
				});
				assert.fail("not implemented yet");
			});

			test("dont create a .log file when transaction has no events (even when transaction is marked as ready to commit", async function(){
				await model.withReadWriteInstance((instance, readyToCommit) => {
					// do nothing
					readyToCommit();
				});
				assert.ok(Object.keys(fs.files).length, 0);
			});

			test("retry and write .log with next fileno", async function(){
				assert.fail("not implemented yet");
			});

			test("retry until retry count is reached, then fail transaction", async function(){
				assert.fail("not implemented yet");
			});

		});



		suite(".snapshot(snapshotName)", function () {

			test("create snapshot from one log file", async function () {
				fs.files = {
					"1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "memberAdded",
							"data": {
								"firstname": "peter",
								"lastname": "pan"
							}
						}]
					}`
				};

				await model.snapshot();
				assert.ok(fs.files["1.some-model-snapshot"]);
			});

			test("create snapshot from two log files", async function () {
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

				await model.snapshot();
				assert.ok(fs.files["2.some-model-snapshot"]);
			});

			test("create snapshot from a snapshot file and one log file", async function () {
				fs.files = {
					"1.some-model-snapshot": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.000Z"
						},
						"snapshot":{
							"members": [
								{"firstname": "arjan", "lastname": "einbu"},
								{"firstname": "marit", "lastname": "winge"}
							]
						}
					}`,
					"2.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "memberAdded",
							"data": {
								"firstname": "peter",
								"lastname": "pan"
							}
						}]
					}`
				};

				await model.snapshot();
				assert.ok(fs.files["2.some-model-snapshot"]);
			});

		});

	});
});