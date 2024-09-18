// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *
//   Copyright Xialia.com  2011-2017
//   FILE : src/lex/routes
//   MANDATORY: routes definitions
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *

const a = {
  room             : {
    public         : {
      module       : require('../service/room'),
      services     : {
        open       : 'open'
      }
    }
  },
  block            : {
    private        : {
      module       : require('../service/private/block'),
      services     : {
        list       : 'list'
      }
    },
    public         : {
      module       : require('../service/block'),
      services     : {
        read       : 'read',
        search     : 'search',
        content    : 'content'
      }
    }
  }
};
module.exports = a;

