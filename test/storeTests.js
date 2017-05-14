const {	suite, test } = require("mocha");
const assert = require("assert");
const FakeAwaitableFs = require("./FakeAwaitableFs");
const camelToPascalCase = require("../source/camelToPascalCase");

const Store = require("../source/Store");

suite("new Store()", function () {

	let fsp = new FakeAwaitableFs();
	let store = new Store("not-a-folder", "model-name", () => {}, {fsp});

	suite("getLatestFileNo", function () {

		test("with no files", function () {
			let files = [];
			let latestFileno = store.getLatestFileNo(files, "log");

			assert.equal(latestFileno, 0);
		});

		test("with one file", function () {
			let files = ["1.log"];
			let latestFileno = store.getLatestFileNo(files, ".log");

			assert.equal(latestFileno, 1);
		});

		test("with multiple files of same type", function () {
			let files = ["1.log", "2.log", "3.log"];
			let latestFileno = store.getLatestFileNo(files, ".log");

			assert.equal(latestFileno, 3);
		});

		test("with multiple files of different types", function () {
			let files = ["1.log", "2.log", "3.log", "4.log", "3.some-snapshot", "1.other-snapshot", "2.other-snapshot"];
			let latestLogFileno = store.getLatestFileNo(files, ".log");
			let latestSomeSnapshotFileno = store.getLatestFileNo(files, ".some-snapshot");
			let latestOtherSnapshotFileno = store.getLatestFileNo(files, ".other-snapshot");

			assert.equal(latestLogFileno, 4);
			assert.equal(latestSomeSnapshotFileno, 3);
			assert.equal(latestOtherSnapshotFileno, 2);
		});

	});

	suite("camelToPascalCase", function () {

		test("'someString' to 'SomeString'", async function () {
			let result = camelToPascalCase("someString");

			assert.equal(result, "SomeString");
		});

	});

});