const global = require('../global');

function simpleSelectNode(nodes) {
  const node = nodes.shift();
  nodes.push(node);
  return node;
}

function response(node) {
  return {
    serviceAddress: node.Address,
    port: node.ServicePort
  }
}

class CatalogService {
  constructor(consul) {
    this.consul = consul;
    this.interval = 'off';
  }

  /**
   *
   * @param opts
   * {
   *   serviceName: '服务名称'(必须)
   * }
   * @returns {*|IDBRequest<IDBValidKey>|Promise<void>}
   */
  nodes(opts) {
    if (typeof opts !== 'object') {
      return this.consul.errorHandler({ status: 400, message: 'params should be an object' });
    }
    if (!opts.serviceName) {
      return this.consul.errorHandler({ status: 400, message: 'not serviceName' });
    }
    const query = {
      serviceName: 'catalog.service.nodes',
      path: `/catalog/service/${ opts.serviceName }`
    };
    if (global.getServiceInfo[opts.serviceName]) {
      const serviceNode = simpleSelectNode(global.getServiceInfo[opts.serviceName]);
      if (serviceNode) {
        return Promise.resolve(this.consul.successHandler(response(serviceNode)));
      }
      return Promise.reject(this.consul.errorHandler({ status: 500, message: 'cache data is empty' }))
    }
    const url = this.consul.baseUrl + query.path;
    return this.getNodesFromConsul(url, opts.serviceName)
      .then((data) => {
        // 创建定时触发器
        this.intervalGetNodes(url, opts.serviceName);
        return this.consul.successHandler(response(simpleSelectNode(data)));
      })
      .catch((err) => {
        return this.consul.errorHandler(err);
      })
  }

  /**
   * 从consul服务拉取到信息
   * @param url
   * @param serviceName
   * @returns {Promise<T | never>}
   */
  getNodesFromConsul(url, serviceName) {
    return this.consul.get({ url })
      .then((data) => {
        try {
          data = JSON.parse(data);
          if (data.length === 0) {
            return Promise.reject({ status: 500, message: 'data is empty array' })
          }
          global.getServiceInfo[serviceName] = data;
        } catch (e) {
          console.log(e);
          return Promise.reject({ status: 500, message: 'res data error' })
        }
        return Promise.resolve(data);
      })
      .catch((err) => {
        return Promise.reject(err)
      })
  }

  /**
   * 创建定时器
   * @param url
   * @param serviceName
   */
  intervalGetNodes(url, serviceName) {
    // 此状态标识，当一个请求没有结束的时候，定时任务暂时不执行
    const _that = this;
    if (this.interval === 'off') {
      setInterval(function () {
        _that.getNodesFromConsul(url, serviceName);
      }, 10000);  // 暂定10秒钟一次
      this.interval = 'on';
    }
  }
}

module.exports = CatalogService;