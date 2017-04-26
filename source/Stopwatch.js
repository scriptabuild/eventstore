
module.exports.start = module.exports.startNew = function () {
	let startTime = new Date();
	return {
		elapsed(reset) {
			let now = new Date();
			let elapsedTime = now - startTime;
			if (reset) {
				startTime = new Date();
			}
			return elapsedTime;
		}
	};
};
