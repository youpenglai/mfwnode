const Service = require('./service');
const requestPromise = require('./requestPromise');

class Registry extends requestPromise {
  constructor(opts) {
    super();
    if (!opts) opts = {};
    opts.baseUrl = (opts.isHttps ? 'https:' : 'http:') + '//' +
      (opts.host || '127.0.0.1') + ':' +
      (opts.port || 8500) + '/v1';
    this.baseUrl = opts.baseUrl;
    this.services = new Service(this);
  }

  /**
   * 注册服务
   * @param opts
   * @returns {*}
   */
  register(opts) {
    return this.services.register.call(this.services, opts);
  }

  /**
   * 发现服务
   * @param opts
   * @returns {*}
   */
  discover(opts) {
    return this.services.discover.call(this.services, opts);
  }
}

module.exports = Registry;