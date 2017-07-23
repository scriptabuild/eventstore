// @flow
const { suite, setup, test } = require("mocha");
const assert = require("assert");

const defineStore = require("../source/defineStore");
const FakeAwaitableFs = require("./FakeAwaitableFs");


const log = () => {}; //console.log;
function MemberListDomainModel(dispatch, storeModel) {
	this.registerNewMember = function(member) {
		dispatch("newMemberRegistered", { member });
		log("MAIL -> welcome to new member");
	}

	this.endMembership = function(name) {
		dispatch("membershipEnded", { name });
		log("MAIL -> goodbye to member");
	}

	this.correctAddress = function(name, address) {
		dispatch("addressCorrected", { name, address });
	}

	this.memberHasMoved = function(name, address) {
		dispatch("memberHasMoved", { name, address });
	}

	this.listMembers = function() {
		let members = storeModel.members;
		let ret = Object.keys(members).map(key => Object.assign({ name: key }, members[key]));
		return ret;
	}
}



function MemberListStoreModel(snapshotData) {
	let members = snapshotData || {};	// This is where the model is materialized!

	this.createSnapshotData = () => members;	// This is the method used to serialize to a snapshot. This method is the inverse of the above assignment of snapshotData

	this.eventHandlers = {
		onNewMemberRegistered(eventdata) {
			if (members[eventdata.member.name]) {
				throw new Error(`onNewMemberRegistered failed. ${eventdata.member.name} is already a member.`)
			}
			members[eventdata.member.name] = {
				address: eventdata.member.address,
				membershipLevel: eventdata.member.membershipLevel
			};
		},

		onMembershipEnded(eventdata) {
			if (!members[eventdata.name]) {
				throw new Error(`onMembershipEnded failed. ${eventdata.name} is not a member.`)
			}
			delete members[eventdata.name];
		},

		onAddressCorrected(eventdata) {
			if (!members[eventdata.name]) {
				throw new Error(`onAddressCorrected failed. ${eventdata.name} is not a member.`)
			}
			members[eventdata.name].address = eventdata.address;
		},

		onMemberHasMoved(eventdata) {
			if (!members[eventdata.name]) {
				throw new Error(`onMemberHasMoved failed. ${eventdata.name} is not a member.`)
			}
			members[eventdata.name].address = eventdata.address;
		}
	}

	Object.defineProperty(this, "members", { value: members, writable: false});
}



let modelDefinition = {
	snapshotConfiguration: {
		snapshotName: "some-model",
		createSnapshotData: storeModel => storeModel.createSnapshotData()
	},
	getEventHandlers: storeModel => storeModel.eventHandlers,
	createStoreModel: snapshotData => new MemberListStoreModel(snapshotData),
	createDomainModel: (dispatch, storeModel) => new MemberListDomainModel(dispatch, storeModel)
}



suite("defineStore(folder, options)", function() {

	let fs;
	let store;
	let model;

	setup(async function() {
		fs = new FakeAwaitableFs();

		store = await defineStore("/not-a-real-folder", { fs });
		model = store.defineModel(modelDefinition);
	});



	suite(".defineModel(modelDefinition)", function() {

		suite(".withReadInstance(action)", function() {

			test("create read only instance from one log file", async function() {
				fs.files = {
					"/not-a-real-folder/1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "newMemberRegistered",
							"data": {
								"member":{
									"name": "arjan einbu",
									"address": "rykkinn",
									"membershipLevel": "silver"
								}
							}
						}]
					}`
				};

				let fulfilled = false;
				await model.withReadInstance(instance => {
					assert.deepEqual(instance.listMembers()[0], { name: "arjan einbu", address: "rykkinn", membershipLevel: "silver" });
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});

			test("create read only instance from two log files", async function() {
				fs.files = {
					"/not-a-real-folder/1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.990Z"
						},
						"events": [{
							"name": "newMemberRegistered",
							"data": {
								"member":{
									"name": "arjan einbu",
									"address": "rykkinn",
									"membershipLevel": "silver"
								}
							}
						}]
					}`,
					"/not-a-real-folder/2.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "newMemberRegistered",
							"data": {
								"member":{
									"name": "marit winge",
									"address": "rykkinn",
									"membershipLevel": "bronze"
								}
							}
						}]
					}`
				};

				let fulfilled = false;
				await model.withReadInstance(instance => {
					assert.deepEqual(instance.listMembers(), [
						{ name: "arjan einbu", address: "rykkinn", membershipLevel: "silver"},
						{ name: "marit winge", address: "rykkinn", membershipLevel: "bronze" }
					]);
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});

			test("create read only instance from a snapshot file", async function() {
				fs.files = {
					"/not-a-real-folder/1.some-model-snapshot": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.000Z"
						},
						"snapshot":{
							"arjan einbu": { "address": "rykkinn", "membershipLevel": "silver"},
							"marit winge": { "address": "rykkinn", "membershipLevel": "bronze"}
						}
					}`
				};

				let fulfilled = false;
				await model.withReadInstance(instance => {
					assert.deepEqual(instance.listMembers(), [
						{ name: "arjan einbu", "address": "rykkinn", "membershipLevel": "silver" },
						{ name: "marit winge", "address": "rykkinn", "membershipLevel": "bronze" }
					]);
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});

			test("create readmodel from a snapshot file and one log file", async function() {
				fs.files = {
					"/not-a-real-folder/1.some-model-snapshot": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.000Z"
						},
						"snapshot": {
							"arjan einbu": { "address": "rykkinn", "membershipLevel": "silver"},
							"marit winge": { "address": "rykkinn", "membershipLevel": "bronze"}
						}
					}`,
					"/not-a-real-folder/2.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "newMemberRegistered",
							"data": {
								"member":{
									"name": "peter pan",
									"address": "neverland"
								}
							}
						}]
					}`
				};

				let fulfilled = false;
				await model.withReadInstance(instance => {
					assert.deepEqual(instance.listMembers(), [
						{ name: "arjan einbu", address: "rykkinn", membershipLevel: "silver" },
						{ name: "marit winge", address: "rykkinn", membershipLevel: "bronze" },
						{ name: "peter pan", address: "neverland", membershipLevel: undefined }
					]);
					fulfilled = true;
				});
				assert.ok(fulfilled, "Async function wasn't called");
			});
		});



		suite(".withReadWriteInstance(action)", async function() {

			test("create a .log file when transaction is marked as ready to commit", async function() {
				await model.withReadWriteInstance((instance, readyToCommit) => {
					instance.registerNewMember({ name: "arjan einbu" });
					readyToCommit();
				});

				assert.ok(Object.keys(fs.files).length, 1);
				assert.ok(fs.files["/not-a-real-folder/1.log"]);
			});

			test("dont create a .log file when transaction isn't marked as ready to commit", async function() {
				await model.withReadWriteInstance((instance, readyToCommit) => {
					instance.registerNewMember({ name: "arjan einbu" });
					// don't mark as readyToCommit!
				});

				assert.equal(Object.keys(fs.files).length, 0);
			});

			test("dont create a .log file when transaction has no events (even when transaction is marked as ready to commit", async function() {
				await model.withReadWriteInstance((instance, readyToCommit) => {
					// do nothing!
					readyToCommit();
				});

				assert.equal(Object.keys(fs.files).length, 0);
			});

			test("retry and write .log with next fileno", async function() {
				await model.withReadWriteInstance((instance, readyToCommit) => {
					// this is simulating concurrent logging, forcing exactly one retry
					fs.files["/not-a-real-folder/1.log"] = `
					{
						"headers": {"time": "2016-12-31T23:59:59.999Z"},
						"events": [{
							"name": "someEvent",
							"data": {}
						}]
					}`;

					instance.registerNewMember({ name: "arjan einbu" });
					readyToCommit();
				});
				assert.ok(Object.keys(fs.files).length, 2);
				assert.ok(fs.files["/not-a-real-folder/2.log"]);
			});

			test("retry 5 times (until retry count is reached) and then fail transaction",  function(done) {
				let count = 0;
				model.withReadWriteInstance((instance, readyToCommit) => {
					// this is simulating concurrent logging, continually forcing retries
					fs.files[`/not-a-real-folder/${++count}.log`] = `
					{
						"headers": {"time": "2016-12-31T23:59:0${count}.999Z"},
						"events": [{
							"name": "someEvent"
						}]
					}`;

					instance.registerNewMember({ name: "arjan einbu" });
					readyToCommit();
				}, 5)
				.then(() => { assert.fail("Should have thrown an exception, instead of going here!"); })
				.catch(() => {done()});
			});

		});



		suite(".snapshot(snapshotName)", function() {

			test("create snapshot from one log file", async function() {
				fs.files = {
					"/not-a-real-folder/1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "newMemberRegistered",
							"data": {
								"member":{
									"name": "Arjan Einbu"
								}
							}
						}]
					}`
				};

				await model.snapshot();
				assert.ok(fs.files["/not-a-real-folder/1.some-model-snapshot"]);
			});

			test("create snapshot from two log files", async function() {
				fs.files = {
					"/not-a-real-folder/1.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.990Z"
						},
						"events": [{
							"name": "newMemberRegistered",
							"data": {
								"member":{
									"name": "Arjan Einbu"
								}
							}
						}]
					}`,
					"/not-a-real-folder/2.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "newMemberRegistered",
							"data": {
								"member":{
									"name": "Marit Winge"
								}
							}
						}]
					}`
				};

				await model.snapshot();
				assert.ok(fs.files["/not-a-real-folder/2.some-model-snapshot"]);
			});

			test("create snapshot from a snapshot file and one log file", async function() {
				fs.files = {
					"/not-a-real-folder/1.some-model-snapshot": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.000Z"
						},
						"snapshot":{
							"members": [
								{"name": "arjan einbu"},
								{"name": "marit winge"}
							]
						}
					}`,
					"/not-a-real-folder/2.log": `
					{
						"headers": {
							"time": "2016-12-31T23:59:59.999Z"
						},
						"events": [{
							"name": "newMemberRegistered",
							"data": {
								"member":{
									"name": "Peter Pan"
								}
							}
						}]
					}`
				};

				await model.snapshot();
				assert.ok(fs.files["/not-a-real-folder/2.some-model-snapshot"]);
			});

		});

	});
});