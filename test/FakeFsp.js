
class FakeFsp {
	constructor(files = {}){
		this.files = files;
	}

	mkdir(/*folder*/){
		return new Promise(resolve => resolve());
	}

	readdir(/*folder*/){
		return new Promise(resolve => resolve(Object.keys(this.files)));
	}

	readFile(filename){
		return new Promise(resolve => resolve(this.files[filename]));
	}

	appendFile(filename, data){
		return new Promise(resolve => resolve(this.files[filename] = data));
	}
}

module.exports = FakeFsp;