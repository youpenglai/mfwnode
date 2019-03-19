const protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');
const Service = require('./service');

class GrpcInit {
  constructor(opts, grpcServer) {
    if (!opts.protoPath) {
      throw new Error('缺少proto文件路径');
    }
    if (!opts.package) {
      throw new Error('缺少包名');
    }
    if (!opts.serviceName) {
      throw new Error('缺少方法名称');
    }
    if (!opts.methods) {
      throw new Error('缺少具体的方法');
    }
    this.protoPath = opts.protoPath;
    this.package = opts.package;
    this.serviceName = opts.serviceName;
    this.methods = opts.methods;
    this.grpcServer = grpcServer;

    this._loadServer()  // 加载
  }

  // 初始化proto文件
  _loadServer() {
    const packageDefinition = protoLoader.loadSync(this.protoPath,
      {'keepCase': true,
        'longs': String,
        'enums': Number, // 定义枚举的接受值
        'defaults': true,
        'oneofs': true,
      });
    this.initFile = grpc.loadPackageDefinition(packageDefinition);
    const nameArr = this.package.split('.');
    for (let i = 0; i < nameArr.length; i++) {
      this.initFile = this.initFile[nameArr[i]];
    }
  }

  /**
   * 注册rpc方法
   */
  register() {
    this.grpcServer.addService(
      this.initFile[this.serviceName].service, new Service(this.methods)
    );
  }
}

module.exports = GrpcInit;
