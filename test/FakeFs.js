const path = require("path");
const valueAsPromise = value => new Promise(resolve => resolve(value));
const rejection = err => new Promise((resolve, reject) => reject(err));

class FakeFs {
	constructor(files = {}){
		this.files = files;
	}

	mkdir(/*folder*/){
		return valueAsPromise();
	}

	readdir(/*folder*/){
		return valueAsPromise(Object.keys(this.files));
	}

	async readFile(filename){
		filename = path.basename(filename);
		if(this.files[filename] === undefined){
			let err = new Error("File not found");
			err.code = "ENOENT";
			return rejection(err);
		}
		return valueAsPromise(this.files[filename]);
	}

	appendFile(filename, data){
		filename = path.basename(filename);
		return valueAsPromise(this.files[filename] = data);
	}
}

module.exports = FakeFs;