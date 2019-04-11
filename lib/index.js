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
}

module.exports = new MfwServer();