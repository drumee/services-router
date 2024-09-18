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

    this.channel = arg[0] || 'LIVE_UPDATE_CHANNEL';
    
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
  
  client.on('error', (err) => console.log('Redis Client Error', err));

  await client.connect();
   const subscriber = client.duplicate();

  await subscriber.connect();
  let count = 0;

  let a = await subscriber.subscribe(this.channel, (message) => {
    count++;
    console.log(`==================${count}======================`)
    console.log(message); // 'message'
  });

  }


}

new __test_example();
