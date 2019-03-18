const AgentService = require('./agent/service');

class Agent {
  constructor(consul) {
    this.service = new AgentService(consul);
  }
}

module.exports = Agent;