const grpc = require('grpc');
const grpcServer = new grpc.Server();
const Ctrl = require('./controller');

class GrpcServer {
  /**
   * 启动rpc服务
   */
  static start() {
    this.start.call(grpcServer);
  }

  /**
   * 绑定rpc服务
   */
  static bind(address) {
    this.bind.call(grpcServer, address, grpc.ServerCredentials.createInsecure());
  }

  /**
   *
   * @param services
   * {
   *   protoPath: '文件路径',
   *   package: '文件包名',
   *   serviceName: 'service名称',
   *   methods: {
   *      serviceName: serviceHandle(去除回调 只支持promise)
   *   } 方法名和方法的执行
   *
   * }
   */
  static add(services) {
    if (!Array.isArray(services)) {
      services = [services]
    }
    console.log(services);
    services.forEach((item) => {
      new Ctrl(item, grpcServer).register();
    })
  }
}

module.exports = GrpcServer;