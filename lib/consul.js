const Catalog = require('./catalog');
const Agent = require('./agent');
const Health = require('./health');
const RequestPromise = require('./requestPromise');

class Consul extends RequestPromise {
  constructor(options) {
    super();
    if (!options) options = {};
    // 默认指向127.0.0.1
    this.baseUrl = 'http://127.0.0.1:8500/v1';

    this.catalog = new Catalog(this);
    this.agent = new Agent(this);
    this.health = new Health(this);
  }
}

module.exports = Consul;