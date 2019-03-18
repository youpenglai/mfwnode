// const os = require('os');

// 获取ip地址
function getBaseUrl() {
  // const ifaces = os.networkInterfaces();
  // const ipAddress = [];
  // Object.keys(ifaces).forEach((ifname) => {
  //   ifaces[ifname].forEach((iface) => {
  //     if ('IPv4' !== iface.family || iface.internal !== false) {
  //       // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
  //       return;
  //     }
  //   })
  // });
  // 现阶段默认是在本机做操作，固定ip
  return '127.0.0.1';
}

exports.getIpAddress = getBaseUrl;