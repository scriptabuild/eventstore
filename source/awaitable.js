const callback = (resolve, reject) => (err, res) => err ? reject(err) : resolve(res);
const awaitable = async action => new Promise((resolve, reject) => action(callback(resolve, reject)))
module.exports = awaitable;