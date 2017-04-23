const {	suite, setup, test } = require("mocha");
const assert = require("assert");
const FakeFsp = require("./FakeFsp");

const defineStore = require("../source/defineStore");

const MemberList = require("../demo/memberList.js")

suite("defineStore", function () {
	let fs;
	let store;

	setup(async function () {
		fs = new FakeFsp();

		store = await defineStore("not-a-folder", {fs});
	});
	
	suite("defineReadWriteModel", function () {

		test("with no files", async function () {
			const createMembersModelCallback = (dispatch, reh, rsh) => new MemberList(dispatch, reh, rsh);
			let currentMembers = store.defineReadWriteModel("members", createMembersModelCallback);

			await currentMembers.withReadWriteModel(model => {
				assert.equal(0, model.listMembers().length);
			})
		});

		test("with one log file containing one event", async function () {
			fs.files = {
				"1.log": `
					{
						"events": [{
							"eventname": "newMemberRegistered",
							"eventdata": {
								"member": {
									"name": "Nina Hansen",
									"address": {
										"street": "Kirkeveien 271"
									},
									"membershipLevel": "gold"
								}
							}
						}]
					}`
			};

			const createMembersModelCallback = (dispatch, reh, rsh) => new MemberList(dispatch, reh, rsh);
			let currentMembers = store.defineReadWriteModel("members", createMembersModelCallback);

			await currentMembers.withReadWriteModel(model => {
				assert.equal(1, model.listMembers().length);
			});
		});

		test("with one log file containing multiple events", async function () {
			fs.files = {
				"1.log": `
					{
						"events": [{
							"eventname": "newMemberRegistered",
							"eventdata": {
								"member": {
									"name": "Nina Hansen",
									"address": {
										"street": "Kirkeveien 271"
									},
									"membershipLevel": "gold"
								}
							}
						}, {
							"eventname": "newMemberRegistered",
							"eventdata": {
								"member": {
									"name": "Oskar Jensen",
									"address": {
										"street": "Store Ringvei 100"
									},
									"membershipLevel": "silver"
								}
							}
						}]
					}`
			};

			const createMembersModelCallback = (dispatch, reh, rsh) => new MemberList(dispatch, reh, rsh);
			let currentMembers = store.defineReadWriteModel("members", createMembersModelCallback);

			await currentMembers.withReadWriteModel(model => {
				assert.equal(2, model.listMembers().length);
			});
		});

		test("with two log files", async function () {
			fs.files = {
				"1.log": `
					{
						"events": [{
							"eventname": "newMemberRegistered",
							"eventdata": {
								"member": {
									"name": "Nina Hansen",
									"address": {
										"street": "Kirkeveien 271"
									},
									"membershipLevel": "gold"
								}
							}
						}]
					}`,
				"2.log": `
					{
						"events": [{
							"eventname": "newMemberRegistered",
							"eventdata": {
								"member": {
									"name": "Oskar Jensen",
									"address": {
										"street": "Store Ringvei 100"
									},
									"membershipLevel": "silver"
								}
							}
						}]
					}`
			};

			const createMembersModelCallback = (dispatch, reh, rsh) => new MemberList(dispatch, reh, rsh);
			let currentMembers = store.defineReadWriteModel("members", createMembersModelCallback);

			await currentMembers.withReadWriteModel(model => {
				assert.equal(2, model.listMembers().length);
			});
		});

		test("with missing log files should fail", function (done) {
			fs.files = {
				"2.log": `
					{
						"events": [{
							"eventname": "newMemberRegistered",
							"eventdata": {
								"member": {
									"name": "Oskar Jensen",
									"address": {
										"street": "Store Ringvei 100"
									},
									"membershipLevel": "silver"
								}
							}
						}]
					}`
			};

			const createMembersModelCallback = (dispatch, reh, rsh) => new MemberList(dispatch, reh, rsh);
			let currentMembers = store.defineReadWriteModel("members", createMembersModelCallback);

			currentMembers.withReadWriteModel(() => {})
				.then(
					() => done("Missing exception"),
					err => err && err.code === "ENOENT" ? done() : done("Wron exception: " + err.code)
				);
		});

	});
	
});