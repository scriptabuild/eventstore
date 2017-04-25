const path = require("path");
const defineStore = require("../source/defineStore.js");
const MemberList = require("./memberList");
const AllHistoricalMemberList = require("./allHistoricalMemberList");
const ResidensHistoryForMembers = require("./residensHistoryForMembers")

const folder = path.resolve(__dirname, "../temp");
// TODO: remove folder before running tests

(async function () {

	let store = await defineStore(folder);

	const createMembersModelCallback = (dispatch, configureStore) => new MemberList(dispatch, configureStore);
	let currentMembers = store.defineReadWriteModel("members", createMembersModelCallback);

	const createHistoricalMembersModelCallback = (dispatch, configureStore) => new AllHistoricalMemberList(dispatch, configureStore);
	let allHistoricalMembers = store.defineReadModel("historical", createHistoricalMembersModelCallback);

	const createResidensHistoryForMembersModelCallback = (dispatch, configureStore) => new ResidensHistoryForMembers(dispatch, configureStore);
	let residensHistoryForMembers = store.defineReadModel("residens-history", createResidensHistoryForMembersModelCallback);



	await currentMembers.withReadWriteModel((membersModel, readyToCommit) => {
		membersModel.registerNewMember({
			name: "Nina Hansen",
			address: {
				street: "Kirkeveien 271"
			},
			membershipLevel: "gold"
		});
		membersModel.registerNewMember({
			name: "Oskar Jensen",
			address: {
				street: "Store Ringvei 100"
			},
			membershipLevel: "silver"
		});
		membersModel.registerNewMember({
			name: "Kim Jamesson",
			address: {
				street: "Trondheimsveien 453"
			},
			membershipLevel: "bronze"
		});
		membersModel.registerNewMember({
			name: "Kari Kongsli",
			address: {
				street: "Trondheimsveien 453"
			},
			membershipLevel: "silver"
		});
		readyToCommit();
	});



	await currentMembers.withReadWriteModel((memberModel, readyToCommit) => {
		memberModel.correctAddress("Kim Jamesson", {
			street: "Trondheimsveien 435"
		});
		readyToCommit();
	});



	await currentMembers.withReadWriteModel((memberModel, readyToCommit) => {
		memberModel.endMembership("Kari Kongsli");
		readyToCommit();
	});



	await currentMembers.withReadWriteModel((memberModel, readyToCommit) => {
		memberModel.memberHasMoved("Kim Jamesson", {
			street: "Bærumsveien 301"
		});
		readyToCommit();
	});



	await currentMembers.snapshot();
	await currentMembers.withReadWriteModel((membersModel, readyToCommit) => {
		membersModel.registerNewMember({
			name: "Pernille Bråthen",
			address: {
				street: "Smetten 12"
			},
			membershipLevel: "silver"
		});
		membersModel.registerNewMember({
			name: "Karl Gudesen",
			address: {
				street: "Drammensveien 100"
			},
			membershipLevel: "blue"
		});
		readyToCommit();
	});



	await currentMembers.withReadWriteModel((membersModel, readyToCommit) => {
		membersModel.listMembers().forEach(contact => console.log(contact.name));

		let ok = false;
		if (ok) readyToCommit();
	});

	console.log("---");

	await allHistoricalMembers.snapshot();
	await allHistoricalMembers.withReadModel((historicalModel) => {
		historicalModel.listMembers().forEach(contact => console.log(`${contact.name} - ${contact.isMember}`));
	});

	console.log("---");

	await residensHistoryForMembers.snapshot();
	await residensHistoryForMembers.withReadModel((residensModel) => {
		residensModel.listMembers().forEach(contact => console.log(`${contact.name} - ${JSON.stringify(contact.residenses)}`));
	});


	console.log("--- Test total 100K extra events in 1K snapshots of 100 events each ---")

	console.log("*** before 1-1000 loop", new Date().toISOString());
	for (let j = 0; j < 10000; j++) {
		await currentMembers.withReadWriteModel((membersModel, readyToCommit) => {
			for (let i = 0; i < 10; i++) {
				membersModel.registerNewMember({
					name: `Test${i} Testesen${j}`,
					address: {
						street: "Kirkeveien 271"
					},
					membershipLevel: "gold"
				});
			}
			readyToCommit();
		});
	}
	console.log("*** after 1-1000 loop", new Date().toISOString());

	await residensHistoryForMembers.snapshot();
	console.log("*** after snapshot of readmodel", new Date().toISOString());
	await residensHistoryForMembers.withReadModel((residensModel) => {
		console.log("Number of rows", residensModel.listMembers().length);
	});
	console.log("*** after read model", new Date().toISOString());

	// TODO: create same stores twice to test concurrency
	// TODO: create another store to test replaying of logs
	// TODO: create another store to test restoring a snapshot
	// TODO: create another store and delete old logs to test restore snapshot
	// TODO: create another store to test restore snapshot with playback of additional logs
	// TODO: remove a log to test that replay fails
	// TODO: replay to stop point, using lambda -> by file time, by filename, by state of contactlist object
})();