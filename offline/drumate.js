
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/offline/factory.hub
//   TYPE  : module
// ================================  *


const argv    = require('minimist')(process.argv.slice(2));
const schemas = argv.schemas || process.env.SCHEMAS_PATH; 
const Factory = require('./factory');


const drumate = new Factory({
  type    : 'drumate',
  schemas
});

console.log(`STARTING DRUMATE PRODUCTION... \n \
loop time     = ${10000}\n \
SCHEMAS_PATH  = ${schemas}\n \
----------------------------------------------\n`
);
drumate.start();