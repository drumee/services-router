#!/usr/bin/env node

// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *
//   Copyright Xialia.com  2011-2017
//   FILE : src/utils/svc-gen
//   MANDATORY: attributes lexicon
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *

const { readdir } = require("fs/promises");
const { readFileSync, writeFileSync } = require("jsonfile");
const { resolve } = require("path");
const { existsSync } = require('fs');
const { EOL } = require("os");

const target = resolve(
  process.env.UI_SRC_PATH,
  'src/drumee/lex',
  'services.json'
);

let services = {};

async function loadModules(dirname) {
  const walk = async (dir) => {
    try {
      const files = await readdir(dir);
      for (const file of files) {
        if (!/\.json$/i.test(file)) continue;
        let path = resolve(dir, file);
        let content = readFileSync(path);
        let name = file.replace(/\.json$/, '');
        if (content.modules && content.services) {
          services[name] = {};
          for (let k in content.services) {
            services[name][k] = `${name}.${k}`;
          }
        }
      }
    } catch (err) {
      console.error(__dirname, err, process.env);
    }
  };
  await walk(dirname);
}
let pwd = process.env.PWD || process.env.INIT_CWD;
let src_dir = resolve(pwd, 'acl');
console.log(`Loading services ACL from ${src_dir}`);

loadModules(src_dir).then(async () => {
  console.log(`Services files generated into ${target}`);
  let plugin = '/etc/drumee/conf.d/plugins/main.json';
  if (existsSync(plugin)) {
    let { acl } = readFileSync(plugin);
    for (let dir of acl) {
      console.log("AAAA:67", resolve(dir, 'acl'));
      await loadModules(resolve(dir, 'acl'));
    }
  }
  console.log("Services map:\n", services);
  writeFileSync(target, services, { spaces: 2, EOL });
  process.exit(0);
}).catch((e) => {
  console.error("Failed to generate services map", e);
  process.exit(1);
})