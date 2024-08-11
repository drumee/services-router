#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *

const Minimist = require('minimist');
const Path = require('path');
const { Attr, Mariadb, Offline } = require('@drumee/server-essentials');

class __websocket_push extends Offline {



  // ========================
  // initialize
  // ========================
  initialize() {
    const argv = Minimist(process.argv.slice(2));
    this.yp = new Mariadb({ user: process.env.USER });
    let data, dest, content;
    try {
      dest = JSON.parse(argv._[0]);
    } catch (e) {
    }
    try {
      data = JSON.parse(argv._[1]);
      if (!data.mfs_root) data.mfs_root = Path.resolve(data.home_dir, '__storage__');
      content = {
        data,
        socket_id: dest.socket_id,
        service: dest.service,
        options: {
          service: Attr.status,
          keys: [Attr.nid, Attr.hub_id],
          message: 'PREVIEW_GENERATION'
        },
        recipient: {
          id: dest.socket_id,
          uid: data.holder_id,
          firstname: data.firstname,
          lastname: data.lastname
        }
      }
    } catch (e) {
      console.warn("GOT ERROR", e);
      process.exit();
    }
    this.debug("AAAA:79", dest, content);
    switch (dest.type) {
      case Attr.drumate:
        this.pushToDrumate(dest.hub_id, data);
        break;
      case Attr.hub:
        this.pushToHub(dest.hub_id, data);
        break;

    }
  }

  /**
   * 
   * @param {*} dest 
   * @param {*} data 
   */
  pushToDrumate(id, data) {

  }

  /**
   * 
   * @param {*} id 
   * @param {*} data 
   */
  pushToHub(id, data) {

  }
}

new __websocket_push();
module.exports = __websocket_push;
