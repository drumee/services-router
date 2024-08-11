#!/usr/bin/env node

const {Mariadb} = require('@drumee/server-essentials');
const yp = new Mariadb({ user: process.env.USER, verbose: 0 });
const Minimist = require('minimist');
const Path = require('path');
const argv = Minimist(process.argv.slice(2));
const _ = require('lodash');
const {removeDrumate} = require('./account');
if (argv.test == null) argv.test = 1;
function usage(a) {
  const prog_name = Path.basename(process.argv[1]);
  if (a) {
    console.log(`Usage ${prog_name} :  ${a}`);
  } else {
    console.log(`Usage ${prog_name} \
    --url=[organisation url]\n
    --test=[1|0]`
    );
  }
  process.exit(1);
}

function done() {
  console.log('Done sucessfully', argv.test);
  yp.end();
  process.exit(0);
}

function failed(e) {
  console.error('Error occured : ', e);
  yp.end();
  process.exit(1);
}

async function check_sanity(cb) {
  argv.url || usage();
  (process.env.USER == 'root') || usage('Must be run by root');
}

function start() {
  return new Promise(async (resolve, reject) => {
    let org = await yp.await_query(`SELECT * FROM organisation WHERE link="${argv.url}"`);
    if (!org || !org.domain_id) {
      console.error(`Organisation ${argv.url} NOT FOUND `);
      reject(1);
    }
    let users = await yp.await_query(`SELECT id, email FROM drumate WHERE domain_id=${org.domain_id}`);
    if (argv.test) {
      console.log("Following accounts will be deleted:", users, org);
      resolve();
    } else {
      if (!users) {
        users = [];
      } else if (users.email) {
        users = [users];
      }
      console.log("Following accounts will be ACTUALLY deleted after", users);
      let i = argv.timeout || 10;
      let timer = setInterval(async () => {
        i--;
        process.stdout.write(`..... ${i} seconds \r`)
        if (i > 0) return;
        clearTimeout(timer);
        for (var user of users) {
          await removeDrumate({ test: 0, user: user.email, yp });
          await yp.await_query(`DELETE FROM map_role WHERE uid="${user.id}"`);
          await yp.await_query(`DELETE FROM privilege WHERE uid="${user.id}"`);
        }
        await yp.await_query(`DELETE FROM domain WHERE id=${org.domain_id}`);
        await yp.await_query(`DELETE FROM vhost WHERE dom_id=${org.domain_id}`);
        await yp.await_query(`DELETE FROM map_role WHERE org_id='${org.id}'`);
        resolve();
      }, 1000);
    }
  })
}
start().then(done).catch(failed);

