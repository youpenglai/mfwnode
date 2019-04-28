const grpc = require('grpc');
const grpcServer = new grpc.Server();

class GrpcServer {

  constructor(opts) {
    if (!opts) opts = {};
    if (!opts.port) {
      throw new Error('must have port');
    }
    this.address = `0.0.0.0:${opts.port}`
  }

  /**
   * 启动rpc服务
   */
  start() {
    return grpcServer.start()
  }

  /**
   * 绑定rpc服务
   */
  addAddress() {
    return grpcServer.bind(this.address, grpc.ServerCredentials.createInsecure())
  }

  /**
   * grpc增加服务
   * @param server 具体的哪一个方法
   * @param serviceMap 方法的名称
   */
  add(server, serviceMap) {
    grpcServer.addService(server, serviceMap);
  }
}

module.exports = GrpcServer;