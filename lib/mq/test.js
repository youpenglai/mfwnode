

const Mq = require('./index');


const mq = new Mq({});

// async function test() {
//   await mq.createConnect();
//   const channel = await mq.createChannel();
//
//   channel.publish('fanoutExchange', '', 'ass')
// }
//
// test()
// .then((data) => {
//   console.log(data)
// })
// .catch((err) => {s
//   console.log(err)
// })
//
async function test() {
  await mq.createConnect();
  const channel = await mq.createChannel();
  const channel1 = await mq.createChannel('channl1');
  await channel.consume('ss', (msg) => {
    console.log(msg)
  });
  await channel.consumeAutoGenerationQueue('heige', '','s',(msg) => {
    console.log(msg)
  });
  // console.log('come')
  await mq.close();
  // let otherName = '';
  // await channel.consumeTemporaryQueue('ssbbsda.exchange', 'topic', 'fd', (msg) => {
  //   console.log(msg)
  // })
}
//
test()
.then((data) => {
  console.log(data)
})
.catch((error) => {
  console.log(error)
})
