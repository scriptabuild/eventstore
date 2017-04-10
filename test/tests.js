const {	suite, setup, teardown, test } = require("mocha");
const assert = require("assert");
const FakeFsp = require("./FakeFsp");
const defineStore = require("../source/defineStore");
const MemberList = require("../demo/memberList.js")
const AllHistoricalMemberList = require("../demo/allHistoricalMemberList.js")

suite("defineStore", function () {
	let options;
	let store;

	setup(async function () {
		options = {
			fsp: new FakeFsp({})
		};

		store = await defineStore("not-a-folder", options);
	});
	
	suite("defineReadWriteModel", function () {

		test("with empty init", function (done) {
			const createMembersModelCallback = (dispatch, reh, rsh) => new MemberList(dispatch, reh, rsh);
			let currentMembers = store.defineReadWriteModel("members", createMembersModelCallback);

			currentMembers.withReadWriteModel(model => {
				assert.equal(0, model.listMembers.length);
			})
			done();
		});

	});
	
	suite("defineReadModel", function () {

		test("with empty init", async function () {
			const createHistoricalMembersModelCallback = (dispatch, reh, rsh) => new AllHistoricalMemberList(dispatch, reh, rsh);
			let allHistoricalMembers = store.defineReadModel("historical", createHistoricalMembersModelCallback);

			await allHistoricalMembers.withReadModel(model => {
				assert.equal(0, model.listMembers().length);
			});
		});

		test("This is test 3", function () {
			assert.equal(3, 3);
		});

	});
});