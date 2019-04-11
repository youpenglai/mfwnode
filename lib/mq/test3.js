
const Mq = require('./index');


const mq = new Mq({});

async function test() {
  await mq.createConnect();
  const channel = await mq.createChannel();
  // return channel.consume('heige', (msg) => {
  //   console.log(msg)
  //   return Promise.resolve(msg)
  // })
  // await channel.sendToQueue('heige', 'fdadafsaf')
  await channel.sendToQueue('ss', 'fdadafsaf')
};

test()
  .then((data) => {
    console.log(data)
  })
  .catch((err) => {
    console.log(err)
  })