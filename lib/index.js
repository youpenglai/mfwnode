const Registry = require('./registry');
const GrpcServer = require('./server');
const GrpcClient = require('./client');

class MfwServer {
  constructor() {
    this.Registry = new Registry();
    this.Server = new GrpcServer();
    this.Client = GrpcClient;
  }
}

module.exports = new MfwServer();