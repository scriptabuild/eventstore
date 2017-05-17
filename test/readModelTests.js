// const {	suite, setup, test } = require("mocha");
// const assert = require("assert");
// const FakeFs = require("./FakeAwaitableFs");

// const defineStore = require("../source/defineStore");

// const AllHistoricalMemberList = require("../demo/allHistoricalMemberList.js")

// suite("defineStore", function () {
// 	let fs;
// 	let store;

// 	setup(async function () {
// 		fs = new FakeFs();

// 		store = await defineStore("not-a-folder", {fs});
// 	});
	
// 	suite("defineReadModel", function () {

// 		test("with no files", async function () {
// 			const createHistoricalMembersModelCallback = (dispatch, reh, rsh) => new AllHistoricalMemberList(dispatch, reh, rsh);
// 			let allHistoricalMembers = store.defineReadModel("historical", createHistoricalMembersModelCallback);

// 			await allHistoricalMembers.withReadModel(model => {
// 				assert.equal(0, model.listMembers().length);
// 			});
// 		});

// 		test("with one log file containing one event", async function () {
// 			fs.files = {
// 				"1.log": `
// 					{
// 						"events": [{
// 							"eventname": "newMemberRegistered",
// 							"eventdata": {
// 								"member": {
// 									"name": "Nina Hansen",
// 									"address": {
// 										"street": "Kirkeveien 271"
// 									},
// 									"membershipLevel": "gold"
// 								}
// 							}
// 						}]
// 					}`
// 			};

// 			const createHistoricalMembersModelCallback = (dispatch, reh, rsh) => new AllHistoricalMemberList(dispatch, reh, rsh);
// 			let allHistoricalMembers = store.defineReadModel("historical", createHistoricalMembersModelCallback);

// 			await allHistoricalMembers.withReadModel(model => {
// 				assert.equal(1, model.listMembers().length);
// 			});
// 		});

// 		test("with one log file containing multiple events", async function () {
// 			fs.files = {
// 				"1.log": `
// 					{
// 						"events": [{
// 							"eventname": "newMemberRegistered",
// 							"eventdata": {
// 								"member": {
// 									"name": "Nina Hansen",
// 									"address": {
// 										"street": "Kirkeveien 271"
// 									},
// 									"membershipLevel": "gold"
// 								}
// 							}
// 						}, {
// 							"eventname": "newMemberRegistered",
// 							"eventdata": {
// 								"member": {
// 									"name": "Oskar Jensen",
// 									"address": {
// 										"street": "Store Ringvei 100"
// 									},
// 									"membershipLevel": "silver"
// 								}
// 							}
// 						}]
// 					}`
// 			};

// 			const createHistoricalMembersModelCallback = (dispatch, reh, rsh) => new AllHistoricalMemberList(dispatch, reh, rsh);
// 			let allHistoricalMembers = store.defineReadModel("historical", createHistoricalMembersModelCallback);

// 			await allHistoricalMembers.withReadModel(model => {
// 				assert.equal(2, model.listMembers().length);
// 			});
// 		});

// 		test("with two log files", async function () {
// 			fs.files = {
// 				"1.log": `
// 					{
// 						"events": [{
// 							"eventname": "newMemberRegistered",
// 							"eventdata": {
// 								"member": {
// 									"name": "Nina Hansen",
// 									"address": {
// 										"street": "Kirkeveien 271"
// 									},
// 									"membershipLevel": "gold"
// 								}
// 							}
// 						}]
// 					}`,
// 				"2.log": `
// 					{
// 						"events": [{
// 							"eventname": "newMemberRegistered",
// 							"eventdata": {
// 								"member": {
// 									"name": "Oskar Jensen",
// 									"address": {
// 										"street": "Store Ringvei 100"
// 									},
// 									"membershipLevel": "silver"
// 								}
// 							}
// 						}]
// 					}`
// 			};

// 			const createHistoricalMembersModelCallback = (dispatch, reh, rsh) => new AllHistoricalMemberList(dispatch, reh, rsh);
// 			let allHistoricalMembers = store.defineReadModel("historical", createHistoricalMembersModelCallback);

// 			await allHistoricalMembers.withReadModel(model => {
// 				assert.equal(2, model.listMembers().length);
// 			});

// 		});
// 	});
// });