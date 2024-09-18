#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *

const Minimist = require('minimist');
const { exit } = require('process');
const redis = require("redis");


const {Offline} = require('@drumee/server-essentials');
class __test_example extends Offline {



  // ========================
  // initialize
  // ========================
  initialize() {
    // let conf = Jsonfile.readFileSync(Path.resolve('configs/example.json'));

    const argv = Minimist(process.argv.slice(2));
    // this.db = new Db({ user: process.env.USER, name: conf.db_name });
    
    this.prepare();

    
  }

  /**
   * 
   * @param {*} msg 
   */
  stop(msg) {
    exit(0);
  }

  /**
   * 
   * @param {*} msg 
   */

  /* 
  */
  async prepare() {
    
    const client = redis.createClient({
      host: "141.95.64.148",
      port: 6379
    });
    // console.log(client);
    
  // client.on('connect', function () {
  //   client.subscribe('exchanges', (message) => {
  //       console.log(message); // 'message'
  //   });

  // }).on('error', function (error) {
  //   console.log(error);
  // });
  
  client.on('error', (err) => console.log('Redis Client Error', err));

  await client.connect();

  await client.ping();

  await client.set('key', 'value-1');
  const value = await client.get('key');
  console.log(value);

 
    // const client = createClient({
    //   // url: 'redis://alice:foobared@awesome.redis.server:6380'
    //   url: 'redis://141.95.64.148:6379'
    // }); 

    const subscriber = client.duplicate();

    await subscriber.connect();

    let a = await subscriber.subscribe('channel', (message) => {
      console.log(message); // 'message'
    });


    const publisher = client.duplicate();

    await publisher.connect();

    await publisher.publish('channel', 'messageing');
    // console.log(subscriber);

    // const data = Jsonfile.readFileSync('/some/files/test.json');

  }


}

new __test_example();
