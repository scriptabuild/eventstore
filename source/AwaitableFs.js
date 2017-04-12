const fs = require("fs");
const awaitable = require("./awaitable");

let AwaitableFs = {
	async mkdir(path, mode = 0o777){
		return awaitable(cb => fs.mkdir(path, mode, cb));
	},

	async readdir(path, options){
		options = Object.assign({encoding: "utf-8"}, options);
		return awaitable(cb => fs.readdir(path, options, cb));
	},

	async readFile(file, options){
		options = Object.assign({encoding: null, flag: "r"}, options);
		return awaitable(cb => fs.readFile(file, options, cb));
	},

	async appendFile(file, data, options){
		options = Object.assign({encoding: null, mode: 0o666, flag: "a"}, options);
		return awaitable(cb => fs.appendFile(file, data, options, cb));
	}
}

module.exports = AwaitableFs;