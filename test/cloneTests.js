const { suite, setup, test } = require("mocha");
const assert = require("assert");

const clone = require("../source/clone");

suite("clone(orig, depth)", function() {

    test("confirm that assiging an object just copies the reference", function() {
        let original = {};
        let copy = original;

        assert(Object.is(copy, original));
    });

    test("confirm that clone(...) creates a new  object, and not just copies the reference", function() {
        let original = { a: 1, b: "hi" };
        let copy = clone(original);

        assert(!Object.is(copy, original));
    });

    test("clones object's properties at first level", function() {
        let original = { a: 1, b: "hi" };
        let copy = clone(original);

        assert.deepStrictEqual(copy, original);
		original.a = 2;
        assert.notDeepStrictEqual(copy, original);
    });

    test("clones object's properties at nested levels", function() {
        let original = { deep1: { a: 2, b: "bye" }, deep2: { c: 3 } };
        let copy = clone(original);

        assert.deepStrictEqual(copy, original);
		original.deep1.a = 4;
        assert.notDeepStrictEqual(copy, original);
    });

    test("clones array", function() {
        let original = [10, 20, 30, "hello", "world"];
        let copy = clone(original);

		assert.deepStrictEqual(copy, original);
		original.push("goodbye");
        assert.notDeepStrictEqual(copy, original);
    });

    test("clones array members at first level", function() {
        let original = [10, 20, 30, "hello", "world"];
        let copy = clone(original);

		assert.deepStrictEqual(copy, original);
		original[0] = 11;
        assert.notDeepStrictEqual(copy, original);
    });

    test("clones array members at nested levels", function() {
        let original = [{ deep1: { a: 10, b: "hello" }, deep2: { c: 20, d: "hello" } }];
        let copy = clone(original);

		assert.deepStrictEqual(copy, original);
		original[0].deep1.a = 11;
        assert.notDeepStrictEqual(copy, original);
    });

    test("cloned functions are bound the the cloned object", function(){
        function TestObjectConstructor(){
            let number = 10;
            this.getNumber = () => number;
            this.increaseNumber = () => {number++;};
        }

        let original = new TestObjectConstructor();
        let copy = clone(original);

        assert.equal(original.getNumber(), 10);
        copy.increaseNumber();
        assert.equal(copy.getNumber(), 11);
    });
});
