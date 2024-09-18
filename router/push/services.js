const P = require('@drumee/server-essentials/lex/permission');

module.exports = {
// --------------------------------------------------
  chat            : {
    module        : require('../../service/push/chat'),
    services      : {
      ring              : ['ring', P.owner],
      send              : ['send', P.owner],
      send_contact_msg  : ['send_contact_msg', P.owner],
      send_group_msg    : ['send_group_msg', P.owner],
      send_contact_file : ['send_contact_file', P.owner],
      send_group_file   : ['send_group_file', P.owner]
    }
  },
  client          : {
    module        : require('../../service/push'),
    services      : { 
      hello       :  ['hello', P.view],
      forward     :  ['forward', P.view],
    }
  },
  notifier        : {
    module        : require('../../service/push/notifier'),
    services      : { 
      get_count   :  ['get_count', P.view],
      notify      :  ['notify', P.view]
    }
  },
};
