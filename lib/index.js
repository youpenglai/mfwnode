const Registry = require('./registry');
const GrpcServer = require('./server');
const GrpcClient = require('./client');
const Mq = require('./mq');

class MfwServer {
  constructor() {
    this.Registry = new Registry();
    this.GrpcServer = new GrpcServer();
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
        throw new Error('get mq config error');
      }
      const [{ serverAddress, port, meta }] = mqConfig;
      const { username, password } = meta;
      // console.log(serverAddress, port, meta)
      return new this.Mq({
        hostname: serverAddress,
        port,
        username,
        password
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }
}

module.exports = new MfwServer();

// module.exports.Registry = Registry;
// module.exports.GrpcServer = GrpcServer;
// module.exports.GrpcClient = GrpcClient;
// module.exports.Mq = Mq;