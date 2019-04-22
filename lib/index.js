const Registry = require('./registry');
const GrpcServer = require('./server');
const GrpcClient = require('./client');
const Mq = require('./mq');

class MfwServer {
  constructor() {
    this.Registry = new Registry();
    this.GrpcServer = GrpcServer;
    this.GrpcClient = GrpcClient;
    this.Mq = Mq;
  }

  /**
   * 自动获取mq的配置,创建连接？
   */
  async getMqConn(serviceName) {
    try {
      const mqConfig = await this.Registry.discover(serviceName);
      if (!mqConfig || mqConfig.length === 0) {
        return Promise.reject(new Error('get mq config error'));
      }
      const { serverAddress, port, meta } = mqConfig;
      const { username, password, vhost, heartbeat } = meta;
      // console.log(serverAddress, port, meta)
      // todo 这个地方是否把连接创建放到外部 这有利于我们写mq的断线重试
      return new this.Mq({
        hostname: serverAddress,
        port,
        username,
        password,
        heartbeat,
        vhost
      })
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async getRedisConn(serviceName) {
    try {
      const mqConfig = await this.Registry.discover(serviceName);
      if (!mqConfig || mqConfig.length === 0) {
        return Promise.reject(new Error('get redis config error'));
      }
      const { serverAddress, port, meta } = mqConfig;
      const { password } = meta;
      // console.log(serverAddress, port, meta)
      return {
        host: serverAddress,
        port,
        password
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

module.exports = new MfwServer();