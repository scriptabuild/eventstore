const path = require("path");
const valueAsPromise = p => new Promise(resolve => resolve(p));

class FakeFsp {
	constructor(files = {}){
		this.files = files;
	}

	mkdir(/*folder*/){
		return valueAsPromise();
	}

	readdir(/*folder*/){
		return valueAsPromise(Object.keys(this.files));
	}

	readFile(filename){
		filename = path.basename(filename);
		return valueAsPromise(this.files[filename]);
	}

	appendFile(filename, data){
		filename = path.basename(filename);
		return valueAsPromise(this.files[filename] = data);
	}
}

module.exports = FakeFsp;