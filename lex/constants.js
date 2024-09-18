// ================================== *
//   Copyright Xialia.com  2011-2017
//   FILE : server/src/lex/constants
//   MANDATORY: various constants     *
// ================================== *

const a = {
  ACCEL_REDIRECT     : 'X-Accel-Redirect',
  ACCEL_STATIC_DIR   : "/srv/www/direct",
  ACCESS_DENIED               : '_access_denied',
  ALREADY_EXIST               : '_ALREADY_EXIST',
  BLOCK_NAME_EXIST            : '_block_name_exist',
  CIRCULAR_REF                : 'circular refrence',
  CONF_TAG           : 'conf#',
  CONFIRM_COPY_AS_NEW_PAGE    : 'CONFIRM_COPY_AS_NEW_PAGE',
  CONFIRM_RESTORE             : 'CONFIRM_RESTORE',
  CONTACT_EXIST               : '_contact_exist',
  COOKIE_GUEST_SID         : 'guest_sid',
  COOKIE_SID         : 'xia_sid',
  COOKIE_UID         : 'xia_uid',
  COOKIE_USERNAME    : 'xia_hid',
  DATA_MAP_TAG       : 'dm#',
  DB_HOST            : 'localhost',
  DB_NOBODY          : 'B_nobody',
  DB_NOHUB           : 'B_nohub',
  DB_USER            : 'www-data',
  DESTINATION_IS_NOT_DIRECTORY: '_destination_is_not_directory',
  DIRECTORY_IS_LOCKED         : '_directory_is_locked',
  DOMAIN_NAME         : 'drumee.com',
  DRIVE_SPACE_NOT_SET         : '_drive_space_not_set',
  DRUMEE_COM          : 'drumee.com',
  DRUMEE_NET          : 'drumee.net',
  EMAIL_ALREADY_EXIST         : '_EMAIL_ALREADY_EXIST',
  EMAIL_NOT_FOUND             : 'EMAIL_NOT_FOUND',  
  EMPTY_OWNER_ID              : 'EMPTY_OWNER_ID',
  ERROR_403_IMG      : '/accel/img/error/404.jpg',
  ERROR_404_IMG      : '/accel/img/error/404.jpg',
  FAILED_CREATE_FILE          : '_failed_create_file',
  FAILED_CREATE_FOLDER        : '_failed_create_folder',
  FAILED_MOVE_FILE            : '_failed_file_move',
  FAILED_SENDING_EMAIL        : '_failed_sending_email',
  FAILED_TO_ROTATE            : '_failed_to_rotate',
  FAILED_UPLOADING            : '_failed_uploading',
  FILE_ALREADY_EXISTS         : '_FILE_ALREADY_EXISTS',
  FILE_NOT_FOUND              : '_FILE_NOT_FOUND',
  FORBIDEN                    : '_forbiden_action',
  FORGOT_PASSWORD             : 'forgot_password',
  GROUP_NOT_FOUND             : 'GROUP NOT FOUND ',
  ID_NOBODY          : 'ffffffffffffffff',
  ID_NOHUB           : 'eeeeeeeeeeeeeeee',
  ID_NOT_FOUND                : 'ID_NOT_FOUND',
  IDENT_NOBODY       : 'nobody',
  IDENT_NOHUB        : 'nohub',
  IGNORED            : 'ign',
  IMCAP_TAG          : 'imcap#',
  IMPROPER_DATA               : '_improper_data',
  INDIVIDUAL                  : 'individual',
  INTERNAL_ERROR              : '_internal_error',
  INTL_EMAIL_TAG     : 'intl#email#',
  INTL_ERROR_TAG     : 'intl#error#',
  INTL_INFO_TAG      : 'intl#info#',
  INTL_LANGUAGES_TAG : 'intl#languages',
  INTL_MSG_TAG       : 'intl#msg#',
  INTL_PAGE_TAG      : 'intl#page#',
  INTL_TAG           : 'intl#',
  INVALID_ACTION              : '_invalid_action',
  INVALID_DATA                : '_invalid_data',
  INVALID_EMAIL_FORMAT        : 'INVALID_EMAIL_FORMAT',
  INVALID_FILENAME            : 'INVALID_FILENAME',
  INVALID_OPTION              : 'INVALID OPTION',  
  INVALID_OWNER_ID            : 'INVALID_OWNER_ID',
  INVALID_OWNER_TYPE          : 'INVALID_OWNER_TYPE',
  INVALID_SCHEMA_TYPE         : '_invalid_schema_type',
  INVALID_TOKEN               : 'INVALID_TOKEN',
  LANG_ALREADY_ACTIVE         : '_lang_already_active',
  LOCALE_TAG         : 'lc#',
  LOCKED                      :'LOCKED MEDIA',
  MEDIA_ROOT_NOT_FOUND        : 'MEDIA_ROOT_NOT_FOUND',
  MEDIA_TTL          : 31536100, // One year //604800, // 1 week
  MEMCACHED_HOST     : 'localhost',
  MEMCACHED_PORT     : 11211,
  NAME_AVAILABLE              : '_name_available',
  NAME_UNAVAILABLE            : '_name_unavailable',
  NO_DEFAULT_MAIL             : "NO_DEFAULT_MAIL",  
  NOT_PUBLISHED               : '_not_published',
  NOTHING_SELECTED            : '_nothing_selected',
  PARENT_DIRECTORY_NOT_FOUND  : 'PARENT_DIRECTORY_NOT_FOUND',
  PARENT_ID_NOT_FOUND         : 'PARENT_ID_NOT_FOUND',
  PERMISSION_DENIED           : '_permission_denied',
  PROFILE_404        : '/accel/img/error/404.jpg',
  REDUNDANT_ACCESS            : 'REDUNDANT_ACCESS',
  REQUIRE_DB_NAME             : 'REQUIRE_DB_NAME',
  REQUIRED_EMAIL              : '_email_required',
  REQUIRED_FIELD              : '_required_field',
  REQUIRED_FIRSTNAME          : '_first_name_required',
  REQUIRED_LASTNAME           : '_last_name_required',
  RESPONSE_CODE      : 'http_code',
  SAFETY_LOCK         : '.xia-safety-lock',
  SANITIZER_TAG      : 'dm#sanitizer',
  SCHEMAS_PATH       : "/srv/worker/etc/db/schemas/",// Shall be overwritten in dev env
  SECRET             : '/etc/drumee/.secret',
  SESSION_ANONYMOUS  : 'SESSION_ANONYMOUS',
  SESSION_ERROR      : 'SESSION_ERROR',
  SESSION_EXPIRED    : 'SESSION_EXPIRED',
  SESSION_GUEST      : 'SESSION_GUEST',
  SESSION_NOT_FOUND  : 'SESSION_NOT_FOUND',
  SESSION_OK         : 'SESSION_OK',
  SESSION_REJECTED   : 'SESSION_REJECTED',
  SESSION_TTL        : 86400*30,  // 2 hours
  SUCCESS                     : 'success',
  TEMP_ROOT          : 'temp_root',
  TMP_DATA_DIR       : '/data/tmp/upload/',
  UNABLE_TO_COPY_ROOT         : '_unable_to_copy_root',
  UNABLE_TO_COPY_SAHREBOX     : '_unable_to_copy_sharebox',
  UNABLE_TO_DELETE_ROOT       : '_unable_to_delete_root',
  UNABLE_TO_MOVE_SAHREBOX     : '_unable_to_move_sharebox',
  UNABLE_TO_RENAME_INBOUND    : '_unable_to_rename_inbound',
  UNABLE_TO_TRANS_INBOUND     : '_unable_to_move/copy_inbound',
  UNAVAILABLE_SPACE           : '_unavailable_space',
  UNEXPECTED_ERROR            : '_unexpected_error',
  UNKNOWN_ERROR               : '_unknown_error',
  UNKNOWN_MSG                 : '_unknown_message',
  UNPUBLISH_TO_DELETE         : '_unpublish_to_delete',
  USER_ALREADY_EXIST          : '_USER_ALREADY_EXIST',
  VFS_ROOT_NODE               : '__storage__',
  WRONG_OLD_PASSWORD          : '_wrong_old_password',
  WRONG_PASSWORD              : '_wrong_password',
  YELLOW_PAGE        : 'yp',
  
  // File aspects
  AUDIO             : 'audio',
  CARD              : 'card',
  BEST              : 'webp',
  GALLERY           : 'gallery',
  ORIGINAL          : 'orig',
  PHOTO             : 'photo',
  SCRIPT            : 'script',
  SLIDE             : 'slide',
  STATIC_FILE       : 'stat',
  STREAM            : 'stream',
  STYLESHEET        : 'stylesheet',
  THEME             : 'theme',
  THUMBNAIL         : 'thumb',
  VIDEO             : 'video',
  VIGNETTE          : 'vignette',
  WEBP              : 'webp',


  // ******  FILES MANIPULATIONS************************
  TRASH          : '/home/trash',
  ARCHIVES       : '/home/archives',
  TMPDIR         : '/data/dev/gopinath/',//'/srv/run/convert/'
  //CONVERT        : '/usr/bin/convert -limit memory 128mb -limit map 256mb -density 300 '
  IMG_CONV       : '/usr/bin/convert -limit memory 128mb -limit map 256mb -density 300  ',
  VDO_CONV       : '/usr/bin/ffmpeg ',
  COMPOSITE      : '/usr/bin/composite ',
  IDENTIFY       : '/usr/bin/identify ',
  MYSQL          : '/usr/bin/mysql ',
  RM             : '/bin/rm ',
  RMF            : '/bin/rm  -f ',
  RMDIR          : '/bin/rm -rf ',
  RSYNC          : '/usr/bin/rsync -a ',
  MV             : '/bin/mv ',
  CP             : '/bin/cp ',
  LS             : '/bin/ls ',
  LS_al          : '/bin/ls -al',
  QT_FAST        : '/usr/bin/qt-faststart ',
  AVCONV         : '/usr/bin/avconv -y ',
  AVPROBE        : '/usr/bin/avprobe ',

  IMG_CRD_OPT    : ' -thumbnail 460x260^ -gravity center -extent 460x260 ', // fixed dimensions
  IMG_THB_OPT    : " -thumbnail '600x600>' ",                               // scaled dimensions
  IMG_VGN_OPT    : " -thumbnail 200x200^ -gravity center -extent 200x200 ", // square dimension
  IMG_SLD_OPT    : " -thumbnail '1024x1024>' ",
  IMG_WEBP_OPT   : " -quality 50 -define webp:lossless:true ",

  VDO_THB_OPT    : ' -f mjpeg -ss 5 -frames:v 1 ', // scale=w='min(500\, iw*3/2):h=-1'
  VDO_VGN_OPT    : ' -thumbnail 300x300^ -gravity center -extent 300x300 ',
  VDO_CRD_OPT    : ' -pix_fmt yuvj422p -frames:v 1 ',
  VDO_PLAY_OPT   : ' -map 0 -c:v libx264 -c:a aac -b:a 64k -strict experimental ',

  OGV_PLAY_OPT   : ' -c:v libtheora -b:v 800k -r:v 25 -crf 15 -c:a libvorbis -b:a 64k ',

  AUDIO_PLAY_OPT : ' -c:a aac -strict experimental ',

  DUMPDB     : '/usr/bin/mysqldump ',
  COFFEE     : '/usr/bin/coffee ',
  SASS       : '/usr/bin/sass ',
  PDFINFO    : '/usr/bin/pdfinfo',
  WGET       : '/srv/etc/drumee/dev/somanos/services/media/auth/slurp.coffee ',


  // ****** MIMES & STUFFS  ************************
  MIME_CSS   : 'text/css',
  MIME_FLV   : 'video/flv',
  MIME_JPG   : 'image/jpg',
  MIME_MP3   : 'audio/mp3',
  MIME_MP4   : 'video/mp4',
  MIME_OGV   : 'video/ogg',
  MIME_PDF   : 'application/pdf',
  MIME_PNG   : 'image/png',
  MIME_RAW   : 'application/octet-stream',
  MIME_WEBP  : 'image/webp',
  MIME_ZIP   : 'application/zip',

  // Network stuffs


  // ////////////////// MOST USED COLUMNS NAME //////////////////////
  DBHOST        : 'db_host',
  DBNAME        : 'db_name',
  FSHOST        : 'fs_host',
  HOME_DIR      : 'home_dir',
  HOME_NODE     : 'home_node',
  HOLDER_ID     : 'holder_id',
  LAYOUT_ROOT   : 'layout_root',
  MEDIA_ROOT    : 'media_root',
  NODE_ID       : 'nid',
  OWNER_ID      : 'oid',
  POSITION      : 'npos',
  SYS_ROOT_C    : 'sys_root_community',
  SYS_ROOT_D    : 'sys_root_drumate',
  USER_FNAME    : 'user_filename',
  VHOST         : 'vhost',

  // ////////////////// USERS & COMMUNITIES TABLES //////////////////////
  PARAMETERS_TABLE    : 'params',
  MEDIA_TABLE         : 'media',
  ATTACHMENTS_TABLE   : 'attachments',
  ACL_TABLE           : 'acl',
  MEMBERS_VIEW        : 'members_view',

  // ////////////////// USERS  //////////////////////
  USER_COMMUNITIES_TABLE : 'communities',
  CONTACTS_TABLE         : 'contacts',
  MEMBERS_TABLE          : 'members',
  DRUMS_STATUS_TABLE     : 'dstatus',
  NEWSWIRE_TABLE         : 'newswire',
  DMAILS_TABLE           : 'dmails',
  NOTICE_VIEW            : 'notice_view',
  COMMUNITY_NOTICE_VIEW  : 'community_notice_view',

  //
  BACKEND_FOLDER         : 'backend',
  FRONTEND_FOLDER        : 'frontend',
  DOWNLOAD_FOLDER        : '__download__',
  MAIL_QUEUE_FOLDER      : '__mail_queue__',
  STORAGE_FOLDER         : '__storage__',
  BATCH_FILE             : 'batch.json',

  // ////////////////// POSTFIX TABLES //////////////////////
  POSTFIX_DB_NAME       : 'postfix',
  POSTFIX_MAILBOX_TABLE : 'mailbox',
  POSTFIX_ALIAS_TABLE   : 'alias',

  // words commonly used
  ACTION            : 'action',
  AREA              : 'area',
  AREAS             : 'areas',
  ALIAS             : 'alias',
  AREA_ID           : 'area_id',
  ASC               : 'ASC',
  ACTIVE            : 'active',
  AUDIO             : 'audio',
  APROPOS           : 'apropos',
  AUTHOR            : 'author',
  AUTHOR_ID         : 'author_id',
  BIRTHDATE         : 'birthdate',
  BOUND             : 'bound',
  BROWSER           : 'browser',
  CACHE_CONTROL     : 'cache_control',
  CAPTION           : 'caption',
  CATEGORY          : 'category',
  CITY              : 'city',
  CLASS      	      : 'class',
  CMAIL             : 'cmail',
  COLUMN            : 'column',
  // COMEX             : 'comex'
  COMMENTS          : 'comments',
  COMMENT           : 'comment',
  COMMUNITY         : 'community',
  CONTACT           : 'contact',
  CONTENT           : 'content',
  CONTEXT           : 'context',
  DATA              : 'data',
  DATE              : 'date',
  DEFAULT           : 'default',
  DELETED           : 'deleted',
  DESCRIPTION      	: 'description',
  DESC              : 'DESC',
  DESTINATION       : 'dest',
  DESTINATION_ID    : 'destination_id',
  DEVICE            : 'device',
  DIRNAME           : 'dirname',
  DMAIL             : 'dmail',
  DOCREADER         : 'docreader',
  DOCUMENT          : 'document',
  DOMAIN            : 'domain',
  DRAFT             : 'draft',
  DRUM              : 'drum',
  EMAIL             : 'email',
  END               : 'end',
  ERROR             : 'error',
  EXT               : 'ext',
  EXTENSION         : 'extension',
  FIELDS      	    : 'fields',
  FILENAME          : 'filename',
  FILES             : 'files',
  FILESIZE          : 'filesize',
  FILETYPE          : 'filetype',
  FILE              : 'file',
  FILE_PATH         : 'file_path',
  FIRSTNAME         : 'firstname',
  FOLDER            : 'folder',
  FOLDERS           : 'folders',
  FROZEN            : 'frozen',
  FULLNAME          : 'fullname',
  GENDER            : 'gender',
  GEOMETRY          : 'geometry',
  GUEST             : 'guest',
  HASHTAG           : 'hashtag',
  HEADLINE          : 'headline',
  HISTORY           : 'history',
  HOME              : 'home',
  HOME_LAYOUT       : 'home_layout',
  HOME_PATH         : 'home_path',
  HUB               : 'hub',
  HID               : 'hid',
  HUB_ID            : 'hub_id',
  HOSTS             : 'hosts',
  HOST_ID           : 'host_id',
  IDENT             : 'ident',
  ID                : 'id',
  IMAGE             : 'image',
  INBOUND           : '__Inbound__',
  ISALINK           : 'isalink',
  KEYWORDS      	  : 'keywords',
  LABEL             : 'label',
  LANG              : 'lang',
  LASTNAME          : 'lastname',
  LAYOUT            : 'layout',
  LENGTH            : 'length',
  LEVEL             : 'level',
  LETC              : 'letc',
  LIST              : 'list',
  LOCALHOST         : 'localhost',
  LOCATION          : 'location',
  MEDEX             : 'medex',
  MEDIA             : 'media',
  MESSAGE           : 'message',
  METADATA          : 'metadata',
  METHOD       	    : 'method',
  METHODS      	    : 'methods',
  MIMETYPE          : 'mimetype',
  NAME              : 'name',
  NEWEST            : 'newest',
  NICKNAME          : 'nickname',
  NID               : 'nid',
  NOBOUND           : '__Nobound__',
  NO_CACHE          : 'no-cache',
  NODE_TYPE         : 'node_type',
  OFFSET            : 'offset',
  ORDER             : 'order',
  ORIGIN_ID         : 'origin_id',
  OTHER             : 'other',
  OUTBOUND          : '__Outbound__', 
  OWNER             : 'owner',
  OWNER_IDENT       : 'owner_ident',
  PAGE              : 'page',
  PARENT            : 'parent',
  PARENT_ID         : 'parent_id',
  PARENT_PATH       : 'parent_path',
  PARTIAL           : 'partial',
  PASSWORD          : 'password',
  PATH              : 'path',
  PDF               : 'pdf',
  PERMISSION        : 'permission',
  PHABET            : 'phabet',
  PHONE             : 'phone',
  PHOTO      	      : 'photo',
  PID               : 'pid',
  PLATFORM          : 'platform',
  PRIVILEGE         : 'privilege',
  PROFILE           : 'profile',
  RANGE             : 'range',
  RATING            : 'rating',
  RAW               : 'raw',
  REFERER           : 'referer',
  RECIPIENT_ID      : 'recipient_id',
  REF_ID            : 'ref_id',
  REMIT             : 'remit',
  REPLACED          : 'replaced',
  ROLE              : 'role',
  ROOT              : 'root',
  SANITIZER         : 'sanitizer',
  SCREEN            : 'screen',
  SCRIPT            : 'script',
  SECURITY          : 'security',
  SHARE             : 'share',
  SOURCE            : 'src',
  SPECIAL           : 'special',
  START             : 'start',
  STATUS      	    : 'status',
  STRING            : 'string',
  STYLESHEET        : 'stylesheet',
  SUBJECT           : 'dsubject',
  SYS_FILE_PATH     : 'sys_file_path',
  SYS_PARENT_PATH   : 'sys_parent_path',
  TABLET            : 'tablet',
  TOPDIR            : 'topdir',
  TOPIC             : 'topic',
  TYPE              : 'type',
  URL               : 'url',
  UNDEFINED         : 'undefined', 
  UPLOAD_TIME       : 'upload_time',
  USERNAME          : 'username',
  VALUE             : 'value',
  VALUES            : 'values',
  VERSION           : 'version',
  VIGNETTE          : 'vignette',
  VIDEO             : 'video',
  WORKER            : 'worker',  

  // Action constants
  ADD_CONTRIBUTOR         : 'add_contributor',
  ADD_CONTACT             : 'add_contact',
  DELETE_DRUMATE_ACCOUNT  : 'delete_drumate_account',
  SHARE_MEDIA             : 'share_media',

  // others
  DESKTOP       : 'desktop',
  MOBILE        : 'mobile',
  DRUMATE       : 'drumate',
  HUB           : 'hub',
  FOLDER        : 'folder',
  DIR_SIZE      : 4096,
  AREA_PRIVATE  : 'private',
  AREA_PUBLIC   : 'public',
  AREA_PERSONAL : 'personal',
  AREA_INDIVIDUAL   : 'individual',

  // Redis Config 

  redis         : {
    LIVE_UPDATE_CHANNEL : 'LIVE_UPDATE_CHANNEL'
  },


  // others
  VERSION      : {
    RENDERER   : '1.1',
    LETC       : '1.2.0'
  },


  // USERS/COMMUNITIES/DIRECTORIES
  USER_DIR_MOD          : '0770',
  COMMUNITY_DIR_MOD     : '0770',
  PUBLIC_DIR            : 'public',
  RESTRICTED_DIR        : 'restricted',
  PRIVATE_DIR           : 'private',
  DIR_PHOTOS            : 'Photos',
  DIR_VIDEOS            : 'Videos',
  DIR_MUSICS            : 'Musics',
  DIR_DOCS              : 'Documents',
  DIR_THUMBS            : '.Thumbs',

  //PERMISSION FOR ACCESSING CONTROLED RESSOURCES
  PERM_HUB_OWNER     : 32, // 0x20 //b'00010000'
  PERM_HUB_ADMIN     : 16, // 0x10 //b'00010000'
  PERM_SITE_ADMIN    : 16, // 0x10 //b'00010000'
  PERM_DELETE        : 16, // 0x10 //b'00010000'
  PERM_DESIGN        : 8,  // 0x08 //b'00001000'
  PERM_ALTER         : 8,  // 0x08 //b'00001000'
  PERM_WRITE         : 4,  // 0x04 //b'00000100'
  PERM_BROWSE        : 2,  // 0x02 //b'00000010'
  PERM_READ          : 1,  // 0x01 //b'00000001'
  PERM_NONE          : 0,  // 0x00 //b'00000000'

  PRIV_HUB_OWNER     : 63,  //0x3F   # Ownership
  PRIV_HUB_ADMIN     : 31,  //0x1F   # Technical staff
  PRIV_HUB_MANAGER   : 15,  //0x0F   # Organization
  PRIV_HUB_DESIGNER  : 7,   //0x07   # Designer
  PRIV_HUB_CONTRIB   : 3,   //0x03   # Read + post + upload
  PRIV_HUB_FOLLOWER  : 3,   //0x02   # Read only + comment
  PRIV_HUB_GUEST     : 1,   //0x01   # Read only
  PRIV_HUB_NONE      : 0,   //0x00   # Nothing at all

  // REMIT_ROOT         : 4, //0x4
  // REMIT_SPACES_ADMIN : 3, //0x3
  // REMIT_USERS_ADMIN  : 2, //0x2
  // REMIT_HUBS_ADMIN   : 1, //0x1
  // REMIT_NONE         : 0, //0x0

  REMIT_ROOT         : 0b1000,
  REMIT_MANAGER      : 0b0100,
  REMIT_SUPPORT      : 0b0010,
  REMIT_OPERATOR     : 0b0001,
  REMIT_DEVEL        : 0b0001,

  // The remit is attached to the visitor whithin the plateform scope
  // Therefore Visitor.get(_a.remit) gives the user remit on the whole plateformr
  // Only staff has remit >= 2
  // remit              : {
  //   root             : 0b1111,  
  //   dom_owner            : 0b0111,  
  //   dom_admin            : 0b0110,  
  //   dom_admin_security   : 0b0101,  
  //   dom_admin_memeber    : 0b0100,  
  //   dom_admin_view       : 0b0011, 
  //   manager          : 0b0111, 
  //   support          : 0b0011,
  //   operator         : 0b0001,
  //   member           : 0b0001,
  // },


  remit              : {
    root                 : 0b1111111,  
    dom_owner            : 0b0111111,  
    dom_admin            : 0b0011111,   
    dom_admin_security   : 0b0001111,  
    dom_admin_memeber    : 0b0000111,  
    dom_admin_view       : 0b0000011,
    dom_member           : 0b0000001,
    owner                : 0b0011111, 
    admin                : 0b0001111, 
    delete               : 0b0000111,
    write                : 0b0000011,
    read                 : 0b0000001,
  },



  // Privilege is the bit block that contains all the privilège
  // The privilege is attached to the visitor whithin the hub scope
  // Therefore Site.get(_a.privilege) gives the user privilege whithin the site
  privilege          : {
    owner            : 0b0111111, 
    admin            : 0b0011111, 
    delete           : 0b0001111,
    write            : 0b0000111,
    read             : 0b0000011,
    anonymous        : 0b0000001,
    //aliases
    modify           : 0b0001111, // delete
    upload           : 0b0000111, // write
    view             : 0b0000011, // read
    download         : 0b0000011, // read
    guest            : 0b0000001, // read 





  },  // read only inside public hubs

  // Permission a particular privilege the user ask for
  // It's a particular among the ones that compose the privilege word 
  // The permission is 
  // Therefore Site.get(_a.privilege) gives the user privilege whithin the site
  permission          : {
    owner            : 0b0100000, 
    admin            : 0b0010000, 
    delete           : 0b0001000,
    write            : 0b0000100,
    read             : 0b0000010,
    anonymous        : 0b0000001,
    modify           : 0b0001000, // delete
    upload           : 0b0000100, // write
    view             : 0b0000010, // read
    download         : 0b0000010, // read
    guest            : 0b0000001, // read 

    dom_owner            : 0b0100000,  
    dom_admin            : 0b0010000,  
    dom_admin_security   : 0b0001000,  
    dom_admin_memeber    : 0b0000100,   
    dom_admin_view       : 0b0000010,
    dom_member           : 0b0000001 


  },

  EMAIL_CHECKER      : new RegExp(/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/),
  PASS_CHECKER       : new RegExp(/^((.+){2,} *(.+){4,})|((.+){12,})$/),
  PHONE_CHECKER        : new RegExp(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/) 
};


  ///^(?=.*[a-z])(?=.*[A-Z])(?=.*\d{1})(?!.*\d{5})(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{8,}$/

// Global var from env
if ((process.env.name != null) && process.env.name.match(/dev\-.+/) && (process.env.SCHEMAS_PATH != null)) {
  a.SCHEMAS_PATH = process.env.SCHEMAS_PATH + '/';
}

// 
    
module.exports = a;
