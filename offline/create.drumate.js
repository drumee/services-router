#!/usr/bin/env node

// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.account
//   TYPE  : module
// ================================  *

require('../core/addons');
const Db        = require('../core/db/mariadb');
const Minimist  = require('minimist');
const Path      = require('path');
const Stringify = require('json-stringify');
const argv      = Minimist(process.argv.slice(2));
const Moment    = require('moment');
usage = function(a){
  const prog_name = Path.basename(process.argv[1]);
  console.log(`Missing argument : ${a}`, )
  console.log(`Usage ${prog_name} --schemas=/path/to/schemas --input=/path/to/xlsx \
  --domain=* --method=[create|delete|show|update]`);
  process.exit(1);
}

const schemas = argv.schemas || process.env.SCHEMAS_PATH || usage();

const yp = new Db({user:process.env.USER});


// -----------------------------------------------------------------
function check_sanity(cb){
  argv.domain || usage('domain');
  argv.input || usage('input');
  schemas || usage('schemas');
  if(argv.input){
    const xlsxj = require("xlsx-to-json");
    const o = argv.input.split('.');
    o.pop();
    let output = o.join() + '.json';
    console.log("ZZZZZ OOOO", o, output);
    xlsxj({
      input: argv.input,
      output: output
    }, function(err, result) {
      if(err) {
        console.error(err);
        process.exit(1);
      }else {
        console.log(result);
        cb(result);
      }
    });
  }
}

const error=function(e){
  console.error("______________________________________\n");
  console.error(e);
  console.error("______________________________________\n");
};

// -----------------------------------------------------------------
async function check(e){
  let entity = await yp.await_proc("__show", e.username);
  let field =  '';
  if(argv.field){
    field = e[argv.field];
  }
  if(_.isEmpty(entity)){
    console.log(`OK............: ${e.username}`, field);
  }else{
    console.log(`ALREADY EXISTS: ${e.username}`, field);
  }
  return;
}

// -----------------------------------------------------------------
async function create(e){
  let pw = e.password;
  delete e.password;
  if(_.isEmpty(e.username)){
    return;
  }
  let entity = await yp.await_proc("__show", e.username);
  console.log(`CREATING  id=${e.username}`, entity);
  if(!_.isEmpty(entity)){
    console.log(`id=${e.username} ALREADY EXIST`, entity.db_name);
    return;
  }
  let rows = await yp.await_proc("drumate_create", pw, Stringify(e));
  let drumate_db = null;
  //console.log("QQQQQQQQQ 102 XXXX", rows);
  if(_.isEmpty(rows)){
    console.error("FAILED : NO RECORD");
    return;
    //process.exit(1);
  }
  for(let r of rows){
    if(r && r.failed){
      console.error(`131 : FAILED TO CREATE 131 username=**${e.username}**`, rows);
      return;
      //process.exit(1);
    }
    if(r.drumate){
      drumate_db = JSON.parse(r.drumate).db_name;
    }
  }
  if(!drumate_db){
    console.error(`139: FAILED TO CREATE ${e.username}`, e, rows);
    return;
    //process.exit(1);
  }else{
    await yp.await_proc(`${drumate_db}.mfs_init_folders`, '[]', 1);
    if(!_.isEmpty(e.domain)){
      await yp.await_query(
        `UPDATE entity SET domain='${e.domain}' WHERE db_name='${drumate_db}'`
      );
    }
  }
}

// -----------------------------------------------------------------
async function remove(e){
  console.log("REMOVING", e.username);
  await yp.await_proc("entity_delete", e.username );
}

// -----------------------------------------------------------------
async function update(e, field){
  console.log("updating", e.username);
  if(_.isEmpty(field)){
    usage();
  }
  let sql = `UPDATE drumate INNER JOIN entity USING(id) \
    SET profile=JSON_SET(profile, "$.${field}", '${e[field]}')\
    WHERE email='${e.email}'`;
  //console.log(sql);
  await yp.await_query(sql);
}

function done(){
  process.exit(0);
}

// -----------------------------------------------------------------
async function show(e){
  delete e.password;
  if(_.isEmpty(e.email)){
    return;
  }
  let r = await yp.await_proc("get_user", e.email);
  if(_.isEmpty(r)){
    console.error(`NO RECORD ${e.email}`);
    return;
  }
  let p = JSON.parse(r.profile);
  console.log(`Firstname    :${p.firstname}`);
  console.log(`Lastname     :${p.lastname}`);
  console.log(`id           :${r.id}`);
  console.log(`db_name      :${r.db_name}`);
  console.log(`email        :${p.email}`);
  console.log(`domain       :${r.domain}`);
  console.log(`domain_id    :${r.domain_id}`);
  console.log(`Organization :${r.organization}`);
  console.log(`Date         :${Moment(r.ctime, "X")}`);
  console.log(`----------------------------------`);
}

// -----------------------------------------------------------------
async function parse(e){
  if(_.isEmpty(e.username)){
    console.error('SPKIP EMPTY RECORD');
    return;
  }
  console.log(`=========== ${e.username} ===========`);
  console.log(`Firstname :${e.firstname}`);
  console.log(`Lastname  :${e.lastname}`);
  console.log(`Username  :${e.username}`);
  console.log(`Password  :${e.password}`);
  console.log(`----------------------------------`);
}

// -----------------------------------------------------------------
function build(entries){
  let pw;
  let list = [];
  let skip = false;
  for(var e of entries){
    skip = false;
    if(_.isEmpty(e.firstname)){
      if(_.isEmpty(e.lastname)){
        console.log("SKIP MALFORMATED DATA. SKIPPED", e);
        skip = true;
      }
      e.firstname = e.lastname[0];
    }

    if(e.username == null){
      e.username = e.firstname[0] + e.lastname.replace(/[\'\ "]/g, '');
    }
    e.username = e.username.toLocaleLowerCase();
    if(_.isEmpty(e.domain)){
      e.domain = argv.domain;
    }
    if(e.email == null){
      e.email = `${e.username}@${e.domain}`;
    }
    if(e.lang == null){
      e.lang = `fr`;
    }
    if(e.mobile){
      if(!/^\+.+$/.test(e.mobile)){
        e.mobile = '+33' + e.mobile;
      }
    }
    if(e.password == null){
      pw = '.' + e.username.toUpperCase() + '.';
    }else{
      pw = e.password;
    }
    e.password = pw;
    if(!_.isEmpty(e.midname)){
      e.lastname = `${e.midname} ${e.lastname}`;
    }
    delete e.midname;
    if(e['']!=null){
      delete e[''];
    }
    if(!skip) list.push(e);
    // if(argv.use==='create'){
    //   // for(var e of list){
    //   // }
    // }
  }
  return list;
}

// -----------------------------------------------------------------
function start(entries){
  const list = build(entries);
  if(argv.dryrun){
    console.log(`========DRY RUN =============\n`);
    if(argv.verbose){
      console.log(e);
    }
    return;
  }
  switch(argv.method){
    case 'create':
      for(var e of list){
        create(e).then().catch(error);
      }
      break;
    case 'delete':
      for(var e of list){
        remove(e).then().catch(error);
      }
      // remove(list[0]).then(done).catch(error);
      break;
    case 'show':
      for(var e of list){
        show(e).then().catch(error);
      }
      break;
    case 'update':
      for(var e of list){
        update(e, argv.field).then().catch(error);
      }
      break;
    case 'check':
      for(var e of list){
        check(e).then().catch(error);
      }  
      break;
    case 'parse':
      for(var e of list){
        parse(e).then().catch(error);
      }  
      break;
    default:
    console.log(`ARGS : ${argv.method}` )
      usage('method')
  }
};

check_sanity(start);

