const Promise = require('bluebird');

class ProxyClass {
  constructor(handle) {
    this.proxy = {};

    this.handle = handle;

    this.addProxy(handle);

    return this.proxy;
  }

  // 添加并补全proxy
  addProxy(handle) {
    if (typeof handle !== 'object') {
      throw new Error('handle is not a object');
    }
    const keys = Object.keys(handle);
    for (let i = 0; i < keys.length; i++) {
      this.proxy[keys[i]] = this._buildService(keys[i]);
    }
  }

  _buildService(handleName) {
    return (call, callback) => {
      // Logger.info(`
      //   rpcName: ${handleName},
      //   timestamp: ${new Date().getTime()},
      //   params: ${JSON.stringify(call.request)}`
      // );
      return Promise.resolve()
        .then(() => {
          return this.handle[handleName](call);
        })
        .then((data) => {
          if (callback) {
            return callback(null, data);
          }
        })
        .catch((err) => {
          if (callback) {
            return callback(Response.create(err));
          }
          call.emit('error', err);
        });
    };
  }
}

module.exports = ProxyClass;
