#!/usr/bin/env node
const Client   = require('../../router/websocket/client');
const _e       = require('@drumee/server-essentials/lex/event');

const sender = {
  id: '42d21f1242d21f1a',
  oid: '42d21f1242d21f1a',
  hub_id: '42d21f1242d21f1a',
  ident: 'som',
  sb_id: '92b3af0492b3af0b',
  sb_db: '6_92b3b10b92b3b10c',
  sb_root: '953871cb953871ce',
  db_name: '9_42d2212142d22122',
  home_dir: '/data/mfs/hub/42d21f1242d21f1a/',
  remit: 7,
  mtime: 1576533358,
  ctime: 1552041487,
  domain: 'drumee.fr',
  lang: 'fr',
  avatar: 'e5510dc6e5510dd3',
  status: 'active',
  profile: {
    lang: 'fr',
    email: 'somanossar@gmail.com',
    ident: 'som',
    avatar: 'e5510dc6e5510dd3',
    mobile: '0607152508',
    lastname: 'Sar',
    location: '{"eu": "1", "ll": [48.6768, 2.3484], "area": 100, "city": "Savigny-sur-Orge", "metro": 0, "range": [1537580800, 1537581055], "region": "IDF", "string": "Savigny-sur-Orge ", "country": "FR", "timezone": "Europe/Paris"}',
    firstname: 'Somanos-Drumee'
  },
  settings: '{"language":"en","wallpaper":{"nid":"5bbc60f0884869ff","hub_id":"4b40b5824b40b58b","vhost":"tunnel.drumee.com"},"cache_control":"no-cache","default_privilege":3}',
  disk_usage: 83938600,
  quota: '{"disk": 500000000, "hub":50}',
  category: 'individual',
  unverified_email: '',
  fullname: 'Somanos-Drumee Sar',
  online: 'off'
};

const message = [
  "chat.ring",
  2222
]

const peer = new Client({
  instance : "51.75.130.67:23001",
  protocol : 'forward',
  sender   : sender,
});

peer.on(_e.connection, function(){
  peer.send(["chat.ring", "gopinath", "Hello ZZZ!!!"]);
})

//client.connect('ws://51.75.130.67:23001/', 'internal', '{"user_id":"som"}');
