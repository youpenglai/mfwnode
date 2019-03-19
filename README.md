# Consul

朋来私有 client.

## Documentation

### registry([options])

Initialize a new Consul client.

Options
 * port (required Integer): agent HTTP(S) port

Usage

``` javascript
const Registry = require('@penglai/mfw').Registry;
Registry.register({
    port: 3500,
    name: 'web11',
    check: {
        type: 'http or grpc'
    }
})

==> promise

Registry.discover(serviceName)
```
### server
``` javascript
const Server = require('@penglai/mfw').Server;
Server.add([{
    protoPath: '文件路径，绝对路径',
    package: '包名',
    serviceName: '方法名',
    methods: {
        fnName: handle
    },
}]);
Server.bind('0.0.0.0:50011');
Server.start();
```

### client
``` javascript
const Client = require('@penglai/mfw').Client;
const client = Client.create({
    ipAddress: 'localhost:60061',
    protoPath: '文件路径',
    package: '包名',
    serviceName: '方法名'
})
client.check()
.then(() => {
    
})
.catch(() => {
    
})
```