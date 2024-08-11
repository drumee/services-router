
require('@drumee/server-core/addons');
const Logger    = require('@drumee/server-core/log/console');
const Path = require('path');
const fs = require('fs');
const Cache     = require('../../dataset/cache');
let cache = new Cache();
let base = process.env.DRUMEE_FRONTEND_HOME;
let instance = process.env.instance_name || process.env.USER;
let mode = process.env.instance_mode || 'build';
//joining path of directory 
const directoryPath = Path.join(base, mode, instance);
console.log("directoryPath", directoryPath);
// fs.readdir(directoryPath, function (err, files) {
//   //handling error
//   if (err) {
//       return console.log('Unable to scan directory: ' + err);
//   } 
//   //listing all files using forEach
//   files.forEach(function (file) {
//       // Do whatever you want to do with the file
//       console.log(file); 
//   });
// });