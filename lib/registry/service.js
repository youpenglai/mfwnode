const utils = require('./utils');

class Service {
  constructor(consul) {
    this.consul = consul;
  }

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
        http: `http://127.0.0.1:${opts.port}/health`,
        interval: '30s'
      }
    }
    // 两种自定义类型
    if (opts.check.type === 'http') {
      opts.check = {
        http: `http://127.0.0.1:${opts.port}/health`,
        interval: '30s'
      }
    } else if (opts.check.type === 'grpc') {
      opts.check = {
        interval: '30s',
        grpc: `127.0.0.1:${opts.port}`
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
        check: opts.check
      }
    })
      .then(() => {
        return this.consul.successHandler()
      })
      .catch((err) => {
        return this.consul.errorHandler(err)
      })
  }

  discover(serviceName) {
    if (!serviceName) {
      return this.consul.errorHandler({ status: 400, message: 'not serviceName' });
    }
    const query = {
      serviceName: 'health.service',
      path: `/health/service/${ serviceName }`
    };
    if (utils.getCache(serviceName)) {
      const serviceNode = utils.getCache(serviceName);
      if (serviceNode) {
        return this.consul.successHandler(serviceNode);
      }
      return this.consul.errorHandler({ status: 500, message: 'cache data is empty' })
    }
    const url = this.consul.baseUrl + query.path;
    return getServerByName(this.consul, url, serviceName)
      .then((data) => {
        // 创建定时触发器
        intervalGetNodes(this.consul, url, serviceName);
        return this.consul.successHandler(data);
      })
      .catch((err) => {
        return this.consul.errorHandler(err);
      })
  }
}

function getServerByName(consul, url, serviceName) {
  return consul.get({ url })
    .then((data) => {
      try {
        data = JSON.parse(data);
        data = dealResponseData(data, serviceName);
        if (data.length === 0) {
          return Promise.reject({ status: 500, message: 'data is empty array' })
        }
        utils.writeCache(serviceName, data);
      } catch (e) {
        return Promise.reject({ status: 500, message: 'res data error' })
      }
      return Promise.resolve(data);
    })
    .catch((err) => {
      return Promise.reject(err)
    })
}

function intervalGetNodes(consul, url, serviceName) {
  // todo 是否考虑定时任务创建情况
  // 此状态标识，当一个请求没有结束的时候，定时任务暂时不执行
  setInterval(function () {
    getServerByName(consul, url, serviceName)
      .catch((e) => {
        console.log('xun huan error')
      })
  }, 10000);  // 暂定10秒钟一次
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

module.exports = Service;