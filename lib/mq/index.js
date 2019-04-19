const amqp = require('amqplib');
const Promise = require('bluebird');
const Channel = require('./channel');

const CONNECT_STATUS = {
  // 关闭
  close: -10,
  // 未连接
  unconnected: 0,
  // 连接中
  connecting: 1,
  // 已连接
  connected: 10
};

const CHANNEL_STATUS = {
  // 关闭
  close: -10,
  // 未连接
  unconnected: 0,
  // 连接中
  connecting: 1,
  // 已连接
  connected: 10
};

/**
 * 一个进程建议只创建一个链接（如果同时有发布和监听， 建议创建两个连接， 将其分开来）
 * https://www.cloudamqp.com/blog/2018-01-19-part4-rabbitmq-13-common-errors.html（mq的避免用法）
 *
 */
class Mq {
  constructor({ protocol = 'amqp', hostname, port, username = 'guest', password = 'guest', vhost, heartbeat = 0 }) {
    this.protocol = protocol;
    this.hostname = hostname;
    this.port = port;
    this.username = username;
    this.password = password;
    this.vhost = vhost ? encodeURIComponent(vhost) : '/';
    this.channels = {};
    this.mqConnectionStatus = CONNECT_STATUS.unconnected;
  }

  /**
   * 创建mq的连接
   * @returns {Promise<void>}
   */
  async createConnect() {
    if ((this.mqConnectionStatus === CONNECT_STATUS.connected)
      || (this.mqConnectionStatus === CONNECT_STATUS.connecting)) {
      return;
    }
    try {
      this.mqConnectionStatus = CONNECT_STATUS.connecting;
      this.MqChannelModel = await amqp.connect({
        protocol: this.protocol,
        hostname: this.hostname,
        port: this.port,
        username: this.username,
        password: this.password,
        vhost: this.vhost
      });
      this.mqConnectionStatus = CONNECT_STATUS.connected;
      this.MqChannelModel.on('close', (err) => {
        this.resetConnect()
      });
      this.MqChannelModel.on('error', (err) => {
        console.log(err)
      });
      await this.resetChannel();
    } catch (e) {

      this.resetConnect()
    }
  }

  /**
   * 重置mq的连接，并重连
   */
  resetConnect() {
    this.mqConnectionStatus = CONNECT_STATUS.close;
    setTimeout(() => this.createConnect(), 5000);
  }

  async resetChannel() {
    const channelList = [];
    for (let i in this.channels) {
      channelList.push(i);
    }
    // console.log(channelList)
    await Promise.map(channelList, (item) => {
      this.channels[item].conn = this.MqChannelModel; // 因为之前的链接已经断了，所以这个地方重置的时候，得改变其连接
      return this.channels[item].resetChannel() // 同时去重置所有的channel
    })
  }

  /**
   * 通道名称
   * @param channelName (通道名称) // 如果只是单线程的话 建议就只用一个(默认的这个)
   * @returns {Promise<*>}
   */
  async createChannel(channelName) {
    if (this.mqConnectionStatus === CONNECT_STATUS.unconnected) {
      throw new Error('mq not connect, please connect mq first');
    }
    if (this.mqConnectionStatus === CONNECT_STATUS.close) {
      throw new Error('mq connect is closed, please restart mq connect');
    }
    if (this.mqConnectionStatus === CONNECT_STATUS.connecting) {
      throw new Error('mq is connecting, wait for a moment');
    }
    channelName = channelName || 'channel1';
    // todo 如果存在就直接返回， 如果是因为断开了，然后去获取这个(这里从新创建的话，有没有可能出现事件丢掉的情况)
    this.channels[channelName] = this.channels[channelName] || {};
    if (this.channels[channelName].channelStatus === 10) {
      return this.channels[channelName]
    }
    try {
      this.channels[channelName] = new Channel(this.MqChannelModel);
      // 创建通道
      await this.channels[channelName].createChannel();

      return this.channels[channelName];
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }

  close() {
    return this.MqChannelModel.close()
  }
}

module.exports = Mq;