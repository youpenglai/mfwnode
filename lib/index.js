const Registry = require('./registry');
const GrpcServer = require('./server');
const GrpcClient = require('./client');

class MfwServer {
  constructor() {
    this.Registry = new Registry();
    this.GrpcServer = new GrpcServer();
    this.GrpcClient = GrpcClient;
  }
}

module.exports = new MfwServer();