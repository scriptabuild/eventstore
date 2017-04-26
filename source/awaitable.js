//
// Utility to turn a nodejs style asyncronous function (ie. one that
// takes a function(err, result) callback parameter) into a function
// that returns a promise. (Since such functions can be await'ed.)
//
// Usage example 1:
//   async function readFile(file, options){
// 	     return awaitable(cb => fs.readFile(file, options, cb));
//   }
//
//   let fileContents = await readFile(file, options);
//
// Usage example 2:
//   let readFile = async(file, options) => awaitable(cb => fs.readFile(file, options, cb));
//
//   let fileContents = await readFile(file, options);
//
// Usage example 3:
//   let fileContents = await awaitable(cb => fs.readFile(file, options, cb);
//

const callback = (resolve, reject) => (err, res) => err ? reject(err) : resolve(res);
const awaitable = async action => new Promise((resolve, reject) => action(callback(resolve, reject)))
module.exports = awaitable;
