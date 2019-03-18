# Consul

朋来私有 client.

## Documentation

### consul([options])

Initialize a new Consul client.

Options
 * port (required Integer): agent HTTP(S) port

Usage

``` javascript
const consul = require('consul')();
```
### register
``` javascript
const consul = require('consul')();
consul.agent.service.register({
    port: 3500, // 端口号必须
    serviceName: 'node-2' // 服务名称必须
})
```

### health
``` javascript
const consul = require('consul')();
consul.health.checks({
    serviceName: 'node-2'  //必须
})
```