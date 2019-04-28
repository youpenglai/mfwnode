const utils = require('./utils');
const RequestPromise = require('./requestPromise');
const _ = require('lodash');

class Service {
  constructor(opts) {
    this.baseUrl = opts.baseUrl;
  }

  register(opts) {
    if (typeof opts !== 'object') {
      // return Promise.reject({ status: 400, message: 'params should be an object' });
      throw new Error('params should be an object');
    }
    if (!opts.port) {
      throw new Error('not port');
      // return Promise.reject({ status: 400, message: 'not port' });
    }
    if (!opts.name) {
      throw new Error('not service name');
      // return Promise.reject({ status: 400, message: 'not name' });
    }
    // 默认给一种检查，http的
    // if (!opts.check) {
    //   opts.check = {
    //     http: `http://127.0.0.1:${opts.port}/health`,
    //     interval: '30s'
    //   }
    // }
    // // 两种自定义类型
    // if (opts.check.type === 'http') {
    //   opts.check = {
    //     http: `http://127.0.0.1:${opts.port}/health`,
    //     interval: '30s'
    //   }
    // } else if (opts.check.type === 'grpc') {
    //   opts.check = {
    //     interval: '30s',
    //     grpc: `127.0.0.1:${opts.port}`
    //   }
    // }
    if (opts.checks) {
      if (!Array.isArray(opts.checks)) {
        opts.checks = [opts.checks]; // 健康检查，应用层自己去填补，文档补上写的规则
      }
    }
    const query = {
      serviceName: 'agent.service.register',
      path: '/agent/service/register'
    };
    const url = this.baseUrl + query.path;
    // request()
    return new RequestPromise().put({
      url,
      params: {
        port: opts.port,
        name: opts.name,
        Tags: opts.Tags || ['node'],
        checks: opts.checks || [],
        Meta: opts.Meta
      }
    })
      .then(() => {
        return Promise.resolve()
      })
      .catch((err) => {
        return Promise.reject(err)
      })
  }

  discover(serviceName) {
    if (!serviceName) {
      throw new Error('not serviceName');
    }
    const query = {
      serviceName: 'health.service', // 记录对应的consul的api
      path: `/health/service/${ serviceName }?passing` // 只返回健康的服务
    };
    if (utils.getCache(serviceName)) {
      const service = randomOutputServer(serviceName);
      if (service) {
        return Promise.resolve(service);
      }
      throw new Error('no server can use')
      // fixme 这里考虑下是否是应该抛出错误，还是从新去http请求
      // throw new Error('cache data error')
    }
    const url = this.baseUrl + query.path;
    return getServer(url) // 获取服务实例
      .then((services) => cacheServer(serviceName, services)) // 缓存服务实例
      .then(() => randomOutputServer(serviceName)) // 随机抛出一个可用实例
      .then((data) => {
        // 定时任务 考虑通过事件去通知
        intervalCacheServer(url, serviceName);
        return Promise.resolve(data)
      })
      .catch((err) => {
        return Promise.reject(err)
      })
  }
}

/**
 * 通过http请求获取服务信息
 * @param url
 * @returns {Promise<Array | never>}
 */
function getServer(url) {
  return new RequestPromise().get({ url })
    .then((data) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        throw new Error('data error');
      }
      const services = dealResponseData(data);
      if (services.length === 0) {
        throw new Error('not have healthy service');
      }
      return Promise.resolve(services)
    })
}

/**
 * 服务基础信息写进缓存
 * @param serviceName
 * @param services
 */
function cacheServer(serviceName, services) {
  utils.writeCache(serviceName, {
    services
  });
}

/**
 * 随机抛出一个可用的服务
 * @param serviceName
 * @returns {*}
 */
function randomOutputServer(serviceName) {
  // todo 换成顺序取，第一个然后弄到最后一个去
  const { services } = utils.getCache(serviceName);
  const serverLength = services.length;
  let upper = (serverLength - 1) >= 0 ? serverLength - 1 : 0;
  const index = _.random(0, upper);
  return services[index]; // 随机返回一个服务
}

/**
 * 定时去更新缓存里面的信息，更新可用的服务信息
 * @param url
 * @param serviceName
 */
function intervalCacheServer(url, serviceName) {
  //todo 要注意避免增加无限多的定时器
  const interval = setInterval(function () {
    getServer(url) // 获取服务实例
      .then((services) => cacheServer(serviceName, services)) // 缓存服务实例
  }, 10000);  // 暂定10秒钟一次
}

function dealResponseData(data) {
  const nodes = [];
  for (let i = 0; i < data.length; i++) {
    // 不需要再人工去检查返回结果 checks里面的数据，因为已经返回的就是健康的数据结果
    nodes.push({
      serverAddress: data[i].Node.Address, // 等于节点的地址
      port: data[i].Service.Port, // 端口号
      meta: data[i].Service.Meta // KV数据
    });
  }
  return nodes;
}

module.exports = Service;