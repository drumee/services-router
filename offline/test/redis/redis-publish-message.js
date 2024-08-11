#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *

const Minimist = require('minimist');
const {Offline} = require('@drumee/server-essentials');
const { exit } = require('process');
const redis = require("redis");


class __test_example extends Offline{



  // ========================
  // initialize
  // ========================
  initialize() {
    // let conf = Jsonfile.readFileSync(Path.resolve('configs/example.json'));

    const argv = Minimist(process.argv.slice(2));
    // this.db = new Db({ user: process.env.USER, name: conf.db_name });

    let arg = argv['_'];
    console.log(arg[0])

    this.message = arg[0] || 'Test message';
    
    this.prepare();
    exit;

    
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
 

  const publisher = client.duplicate();

  await publisher.connect();

  await publisher.publish('channel', this.message); 
  this.stop("")
  exit;

  }


}

new __test_example();
