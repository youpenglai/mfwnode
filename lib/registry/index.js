const Service = require('./service');

class Registry {
  constructor(opts) {
    if (!opts) opts = {};
    opts.baseUrl = (opts.isHttps ? 'https:' : 'http:') + '//' +
      (opts.host || '127.0.0.1') + ':' +
      (opts.port || 8500) + '/v1';
    this.baseUrl = opts.baseUrl;
    this.services = new Service({
      baseUrl: this.baseUrl
    });
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