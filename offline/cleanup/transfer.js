#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
// ================================  *

const Fs = require("fs");
const _k = require('@drumee/server-essentials/lex/constants');
const _ = require('lodash');
const Path = require('path');
const {MfsTools} = require('@drumee/server-core');
const{remove_dir} = MfsTools;
const {Mariadb, Logger} = require('@drumee/server-essentials');
const yp = new Mariadb({ user: process.env.USER });

// const transfer_hub_id = '21cf9a3f21cf9a5a';
// const transfer_db = '8_21cf9d8621cf9d92';
// const home_dir = '/data/mfs/hub/21cf9a3f21cf9a5a/__storage__'
const Minimist = require('minimist');
const { exit } = require("process");


class __offline_tranfer_cleanup extends Logger {
  initialize() {

    this.prepare().then(async (env)=>{
      await this.clean(env);
    }).catch((e)=>{
      console.error(e.toString());
      process.exit(1);
    });

  }

  async prepare(){
    const argv = Minimist(process.argv.slice(2));
    let host = argv.host;
    if(!host) throw "Missing arguments : requires --host=...";
    let sql = `
      SELECT db_name, home_dir, e.id FROM entity e INNER JOIN vhost v ON e.id = v.id
      WHERE fqdn='${host}'
      `;
    let env = await yp.await_query(sql);
    return env;
  }

  async clean(env) {
    // Get expired media
    let home_dir = Path.resolve(env.home_dir, '__storage__');
    let uid = 'ffffffffffffffff';
    let db_name = env.db_name;
    let sql = `
        SELECT  * FROM  ${env.db_name}.permission 
        WHERE expiry_time < UNIX_TIMESTAMP() 
        AND   entity_id ='*'
        AND   expiry_time<>0 
        AND   expiry_time<>-1 LIMIT 10`;

    let files = await yp.await_query(sql);
    if (!_.isArray(files)) {
      files = [files]
    }
    for (let file of files) {
      try {
        let dir;
        let data = await yp.await_proc(`${db_name}.mfs_manifest`, 
          file.resource_id, uid, 1);
        let leafs = data[0];
        if (!_.isArray(leafs)) {
          leafs = [leafs]
        }
        for (let leaf of leafs) {
          dir = Path.resolve(home_dir, leaf.nid);
          console.log(`dir path=${dir}(${Fs.existsSync(dir)}) ,   node_id =${leaf.id}`);
          if (Fs.existsSync(dir)) {
            remove_dir(dir, 0);
          }
        }

        let filepath = Path.resolve(
          process.env.DRUMEE_MFS_DIR, _k.DOWNLOAD_FOLDER, file.message
        );
        // console.log(`download file path=${filepath}(${Fs.existsSync(filepath)})`);

        if (Fs.existsSync(filepath)) {
          remove_dir(filepath, 0);
        }

        await yp.await_proc(`${db_name}.mfs_purge`, file.resource_id);
        await yp.query(`DELETE FROM dmz_token WHERE node_id = '${file.resource_id}'`);
        await yp.await_proc(`${db_name}.permission_revoke`, file.resource_id, '*');

      } catch (e) {
        console.log("ERRROR", e);
      }

    }

    console.log("Removed the expired media");
    process.exit(1);
  }

}

try {
  new __offline_tranfer_cleanup();
} catch (e) {
  console.error(e);
  process.exit(1);
}
