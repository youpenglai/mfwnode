const os = require('os');
const Promise = require('bluebird');

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
 * 考虑下 是否一个channel一个queue， 或者单独开一个channel去做一个检查
 */
class Channel {
  constructor(conn) {
    this.conn = conn;
    this.channel = {};
    this.channelStatus = CHANNEL_STATUS.unconnected;
    this.queuesMap = {};
  }

  async createChannel() {
    if (this.channelStatus === CHANNEL_STATUS.connected) {
      return this.channel
    }
    try {
      this.channelStatus = CHANNEL_STATUS.connecting;
      this.channel = await this.conn.createChannel();
      this.channelStatus = CHANNEL_STATUS.connected;
      this.channel.prefetch(10); // 这个数字有待斟酌, 考虑要不要放大一点
      this.channel.on('error', (error) => {
        console.log(error);
        this.resetChannel()
      });
      this.channel.on('close', (error) => {
        // this.resetChannel()
      });
      return this.channel
    } catch (e) {
      this.channelStatus = CHANNEL_STATUS.unconnected;
      throw e
    }
  }

  resetChannel() {
    this.channelStatus = CHANNEL_STATUS.close;
    this.retryCreateChannel()
  }

  async retryCreateChannel(count = 0) {
    // console.log('....', channelName)
    count++;
    // 三次重试就失败(是否应该让其一直重试)
    if (count === 3) {
      throw new Error('retry create channel error')
    }
    // 正在重连的话 直接返回
    if (this.channelStatus === CHANNEL_STATUS.connecting) {
      return;
    }
    // 如果连接上了，也直接返回
    if (this.channelStatus === CHANNEL_STATUS.connected) {
      return;
    }
    try {
      this.channelStatus = CHANNEL_STATUS.connecting;
      this.channel = await this.createChannel();
      this.channelStatus = CHANNEL_STATUS.connected;
      await this.retryConsumeQueue()
    } catch (e) {
      this.channelStatus = CHANNEL_STATUS.unconnected;
      setTimeout(() => {
        this.retryCreateChannel(count)
      }, 3000) // 3秒一重试
    }
  }

  /**
   * 重置所有的队列
   * @returns {Promise<void>}
   */
  async retryConsumeQueue() {
    const queues = [];
    for (let i in this.queuesMap) {
      queues.push(this.queuesMap[i]);
    }
    await Promise.map(queues, (item) => {
      return this.consume(item.queueName, item.callback, item.consumeConfig)
    })
  }

  /**
   * 单发送消息到队列
   * @param queueName 队列名称
   * @param content 发送的内容
   * @param options 额外的一些参数
   * @returns {Promise<Promise<*>|*>}
   */
  async sendToQueue(queueName, content, options) {
    if (this.channelStatus !== CHANNEL_STATUS.connected) {
      throw new Error('channel not exists or connect error')
    }
    return this.channel.sendToQueue(queueName, Buffer.from(JSON.stringify(content), 'utf-8'), options || {});
  }

  /**
   *
   * @param queueName
   * @param callback
   * @param consumeConfig
   *
   * 这个地方 消息是要手动去ack掉的，注意一点，避免消息堆积过多， 是否nack消息， 然后根据重试次数来做这个操作（db记录消息记录）
   * @returns {Promise<T | never>}
   */
  async consume(queueName, callback, consumeConfig = { noAck: false }) {
    if (this.channelStatus !== CHANNEL_STATUS.connected) {
      throw new Error('channel not exists or connect error')
    }
    this.queuesMap[queueName] = {
      queueName,
      callback,
      consumeConfig
    };
    return this.channel.consume(queueName, callback, consumeConfig)
  }

  /**
   * 交换机发送消息
   * @param exchange
   * @param routingKey
   * @param content
   * @param options
   * @returns {Promise<T | never>}
   */
  async publish(exchange, routingKey, content, options) {
    if (this.channelStatus !== CHANNEL_STATUS.connected) {
      throw new Error('channel not exists or connect error')
    }
    return this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(content), 'utf-8'), options)
  }

  /**
   * 监听临时队列
   * @param exchangeName
   * @param routingKey
   * @param callback
   * @param queueConfig
   * @returns {*|*|*|*|Promise<T | never>}
   */
  consumeTemporaryQueue(exchangeName, routingKey, callback, queueConfig) {
    if (this.channelStatus !== CHANNEL_STATUS.connected) {
      throw new Error('channel not exists or connect error')
    }
    // 检查是否有交换
    let queueName = '';
    return this.channel.assertQueue('', {
      exclusive: true, // 临时队列，当连接断开的时候，此队列会自动删除
      durable: true // 消息是否持久化
    })
    .then((data) => {
      const { queue } = data;
      queueName = queue;
      // 绑定队列到交换上面,此地方默认的交换是fanout所以到根目录就行
      return this.channel.bindQueue(queueName, exchangeName, routingKey || '')
    })
    .then(() => {
      return this.consume(queueName, callback, queueConfig)
    })
    .catch((err) => {
      return Promise.reject(err)
    })
  }

  /**
   * 这个后缀名，尽量固定不要改，不然会生成很多不必要的持久化队列
   * @param exchangeName
   * @param routingKey
   * @param queueName
   * @param callback
   * @param queueConfig
   * @returns {Promise<*|*|*|*|Promise<T | never>>}
   */
  async consumeAutoGenerationQueue(exchangeName, routingKey, queueName, callback, queueConfig) {
    if (this.channelStatus !== CHANNEL_STATUS.connected) {
      throw new Error('channel not exists or connect error')
    }
    return this.channel.assertQueue(queueName, {
      durable: true // 消息是否持久化
    })
    .then(() => {
      return this.channel.bindQueue(queueName, exchangeName, routingKey || '')
    })
    .then(() => {
      return this.consume(queueName, callback, queueConfig)
    })
    .catch((err) => {
      return Promise.reject(err)
    })
  }

  close() {
    // fixme 这个地方想想看， 当通道关闭的时候，发送事件的时候， 可能会有1ms左右的延迟， 刚好这个时候调用方法的时候可能就会出现不是自定义的错误了
    return this.channel.close()
  }

  ack(message) {
    return this.channel.ack(message);
  }

  nack(message) {
    return this.channel.nack(message);
  }
}

module.exports = Channel;