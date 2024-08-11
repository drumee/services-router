#!/usr/bin/env node

const {toArray}        = require('@drumee/server-essentials');
const {MfsTools} = require('@drumee/server-core');
const {remove_dir} = MfsTools;
const {isString}         = require('lodash');

async function removeDrumate(opt){
  let yp = opt.yp;
  let user = await yp.await_proc('get_user', opt.user);
  if(user.id=='ffffffffffffffff'){
    console.error(`${opt.user} NOT FOUND `);
    process.exit(1);
  }
  let p;
  if(_.isString(user.profile)){
    p = JSON.parse(user.profile);
  }else{
    p = user.profile;
  }
  if(!user.db_name){
    console.warn(`User ***${opt.user}*** was not found`);
    return;
  }else{
    let a = 'DRYRUN: ';
    if(!opt.test) a = '!!!! ACTUALLY: ';
    console.log(`${a}DELETING  ${user.fullname} (${p.email})...`, process.env.USER);
  }
  let hubs = await yp.await_proc(`${user.db_name}.show_hubs`);
  hubs = toArray(hubs) || [];
  for(let hub of hubs){
    if(hub.owner_id == user.id){
      if(!opt.test){
        console.log(`DELETING CONTENT ${hub.name}...`);
        await yp.await_proc(`${hub.db_name}.remove_all_members`, 0);
        remove_dir(hub.home_dir);
        await yp.await_proc(`drumate_vanish`, hub.id);
      }else{
        console.log("DRYRUN : OWNER", hub);
      }
    }else{
      if(!opt.test){
        console.log(`LEAVING ${hub.name}...`);
        await yp.await_proc(`${user.db_name}.leave_hub`, hub.id);
      }else{
        console.log("DRYRUN : NOT OWNER", hub);
      }
    }
  }
  if(!opt.test){
    user = await yp.await_proc(`drumate_delete`, user.id);
    remove_dir(user.home_dir);
  }else{
    console.log("DRYRUN : USER", user.id, user.home_dir);
  }
}
module.exports = {removeDrumate};