module.exports.start = function () {
	let startTime = new Date();
	return {
		elapsed(reset) {
			let now = new Date().getTime();
			let elapsedTime = now - startTime;
			if (reset) {
				startTime = new Date().getDate();
			}
			return elapsedTime;
		}
	};
};