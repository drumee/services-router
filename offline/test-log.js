
// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE  : src/service/private/drumate
//   TYPE  : module
// ================================  *


const Fs        = require('fs');
const name = '/var/log/drumee/somanos/info.log';
let size = 0;
Fs.watch(name, (eventType, filename) => {
  if(eventType==='change' && filename){
    let stats = Fs.statSync(name);
    if(size !== stats.size){
      console.log(stats);
      size = stats.size;
    }
  }
});
