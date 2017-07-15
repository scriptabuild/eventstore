// const path = require("path");
const valueAsPromise = value => new Promise(resolve => resolve(value));
const rejection = err => new Promise((resolve, reject) => reject(err));

module.exports = class FakeAwaitableFs {
	constructor(files = {}){
		this.files = files;
	}

	mkdir(/*folder*/){
		return valueAsPromise();
	}

	readdir(folder){
		// let filesInFolder = Object.keys(this.files).filter(x => x.indexOf(folder) == 0);
		// return valueAsPromise(filesInFolder);
		return valueAsPromise(Object.keys(this.files));
	}

	async readFile(filename){
		// filename = path.basename(filename);
		if(this.files[filename] === undefined){
			let err = new Error("File not found");
			err.code = "ENOENT";
			return rejection(err);
		}
		return valueAsPromise(this.files[filename]);
	}

	appendFile(filename, data, options){
		// filename = path.basename(filename);
		if(options.flag == "wx" && this.files[filename]){
			let err = new Error("...");	//TODO: Insert the correct message and code here! -arjan 2017-09-11
			err.code = "...";
			return rejection(err);
		}
		return valueAsPromise(this.files[filename] = data);
	}
}
