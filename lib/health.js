const global = require('./global');

function simpleSelectNode(nodes) {
  const node = nodes.shift();
  nodes.push(node);
  return node;
}

function dealResponseData(data, serviceName) {
  const nodes = [];
  for (let i = 0; i < data.length; i++) {
    let checkInfo = data[i].Checks;
    for (let j = 0; j < checkInfo.length; j++) {
      if (checkInfo[j].ServiceName === serviceName) {
        if (checkInfo[j].Status === 'passing') {
          nodes.push({
            serverAddress: data[i].Node.Address, // 等于节点的地址
            port: data[i].Service.Port
          });
        }
      }
    }
  }
  return nodes;
}

class Health {
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
  checks(opts) {
    if (typeof opts !== 'object') {
      return this.consul.errorHandler({ status: 400, message: 'params should be an object' });
    }
    if (!opts.serviceName) {
      return this.consul.errorHandler({ status: 400, message: 'not serviceName' });
    }
    const query = {
      serviceName: 'health.service',
      path: `/health/service/${ opts.serviceName }`
    };
    if (global.getServiceInfo[opts.serviceName]) {
      const serviceNode = simpleSelectNode(global.getServiceInfo[opts.serviceName]);
      if (serviceNode) {
        return Promise.resolve(this.consul.successHandler(serviceNode));
      }
      return Promise.reject(this.consul.errorHandler({ status: 500, message: 'cache data is empty' }))
    }
    const url = this.consul.baseUrl + query.path;
    return this.getNodesFromConsul(url, opts.serviceName)
      .then((data) => {
        // 创建定时触发器
        this.intervalGetNodes(url, opts.serviceName);
        return this.consul.successHandler(simpleSelectNode(data));
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
          data = dealResponseData(data, serviceName);
          // console.log(data)
          if (data.length === 0) {
            return Promise.reject({ status: 500, message: 'data is empty array' })
          }
          global.getServiceInfo[serviceName] = data;
        } catch (e) {
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
        _that.getNodesFromConsul(url, serviceName)
          .catch((e) => {
            console.log('xun huan error')
          })
      }, 10000);  // 暂定10秒钟一次
      this.interval = 'on';
    }
  }
}

module.exports = Health;