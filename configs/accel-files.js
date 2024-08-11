// ================================  *
//   Copyright Xialia.com  2013-2017 *
//   FILE : src/dataset/accel-files.coffee
//   CLASS :                         *
//   TYPE : dataset
// ================================  *


let static_root;

const a =

(static_root  = "/srv/www/direct");
const static_file  = { 
  default_avatar : {
    name     : "default-profile.svg",
    path     : `${static_root}/accel/img/error/404.jpg`,
    accel    : "/accel/img/svg/default-profile.svg",
    mimetype : 'image/svg+xml',
    code     : 200
  },

  not_found  : { 
    name     : "404.jpg",
    path     : `${static_root}/accel/img/error/404.jpg`,
    accel    : "/accel/img/error/404.jpg",
    mimetype : 'image/jpg',
    code     : 404
  }
};

module.exports = a;

