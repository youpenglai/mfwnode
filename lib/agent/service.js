
class AgentService {
  constructor(consul) {
    this.consul = consul;
  }

  /**
   *
   * @param opts
   * {
   *   port: '端口号', string
   *   name: '服务名称', string
   *   Tags: [], array
   *   check: {
   *     type: 'grpc || http',
   *     path: ''
   *   }
   *
   * }
   * @returns {*|IDBRequest<IDBValidKey>|Promise<void>}
   */
  register(opts) {
    if (typeof opts !== 'object') {
      return this.consul.errorHandler({ status: 400, message: 'params should be an object' });
    }
    if (!opts.port) {
      return this.consul.errorHandler({ status: 400, message: 'not port' });
    }
    if (!opts.name) {
      return this.consul.errorHandler({ status: 400, message: 'not name' });
    }
    // 默认给一种检查，http的
    if (!opts.check) {
      opts.check = {
        http: this.consul.baseUrl + opts.check.path,
        interval: '30s'
      }
    }
    // 两种自定义类型
    if (opts.check.type === 'http') {
      opts.check = {
        http: this.consul.baseUrl + opts.check.path,
        interval: '30s'
      }
    } else if (opts.check.type === 'grpc') {
      opts.check = {
        interval: '30s',
        grpc: this.consul.baseUrl
      }
    }
    const query = {
      serviceName: 'agent.service.register',
      path: '/agent/service/register'
    };
    const url = this.consul.baseUrl + query.path;
    return this.consul.put({
      url,
      params: {
        port: opts.port,
        name: opts.name,
        Tags: opts.Tags || ['node'],
        // port: opts.port,
      }
    })
      .then(() => {
        return this.consul.successHandler()
      })
      .catch((err) => {
        return this.consul.errorHandler(err)
      })
  }
}

module.exports = AgentService;