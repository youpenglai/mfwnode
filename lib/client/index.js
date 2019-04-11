const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
// todo 自动获取ip地址
class GrpcClient {
  static create(opts, options) {
    return new GrpcClient(opts, options)
  }

  constructor(opts) {
    this.ipAddress = opts.ipAddress;
    this.protoPath = opts.protoPath;
    this.package = opts.package;
    this.serviceName = opts.serviceName;
    this.client = {};
    this.proxy = {};
    this._loadServer();
    this._createClient();
    this._createProxyWithClient();
    return this.proxy;
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

  _createClient() {
    this.client = new this.initFile[this.serviceName](this.ipAddress, grpc.credentials.createInsecure());
  }

  _createProxyWithClient() {
    this.proxy = new Proxy(this.client, {
      get: (target, key) => {
        const deadTime = new Date(Date.now() + 5000);
        return function (params) {
          return new Promise((resolve, reject) => { // rpc没有这个方法
            if (!target[key]) {
              return reject(new Error('not this service'))
            }
            // todo 重试机制
            return target[key](params, { deadline: deadTime }, (err, data)=> {
              if (err) {
                return reject(err)
              }
              return resolve(data)
            })
          })
        }
      }
    })
  }
}

module.exports = GrpcClient;