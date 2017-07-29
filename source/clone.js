function clone(orig, depth) {
	// Value types are already copies here, so they don't need to be cloned.
	if (orig === null ||
		typeof orig !== "object" &&
		typeof(orig) !== "function"
	) return orig;
	
	// Make the clone share the same prototype as the original
	var copy = new orig.constructor();

	// Copy every enumerable property not from the prototype
	for (var key in orig) {
		if (orig.hasOwnProperty(key)) {
			if(typeof(orig[key]) === "function") {
				copy[key] = orig[key].bind(orig);
			} else
			if (depth === undefined || depth > 0) {
				copy[key] = clone(orig[key], depth === undefined ? undefined : depth - 1);
			}
			else {
				copy[key] = orig[key];
			}
		}
	}

	return copy;
}

module.exports = clone;