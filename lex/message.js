// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *
//   Copyright Xialia.com  2011-2016                                    *
//   FILE : ./lex/message
//   MANDATORY: warning and errors messages used by various functions   *
// :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: *

const a = {
  argExpected         : 'one argument is expected by this function',
  argRequired         : 'The argument *{0}* is required',
  attr_required       : 'Attribute *{0}* is required',
  broken_widget       : "{0} has crashed",
  hashValueEmpty      : 'The hash array has no value for the key ',
  invalidArg          : "Argument *{0}* is not a valid one",
  modelNotDefined     : "Model not defined, using default",
  noModelAssigned     : " hasn't assigned model",
  no_kind             : "Unknown kind '{0}'",
  no_skeleton         : "A skeleton is required",
  classNotDefined     : "A class definition is required",
  notAmethod          : "*{0}* is not a method",
  unexpected          : "An error has occured",

  // see yp.error + yp.intl tables
  bad_api             : '_improper_data',
  bad_service         : '_invalid_service_name',
  permission_denied   : '_permission_denied',
  internal_error      : '_internal_error',
  duplicate_entry     : '_duplicate_entry'
};

const b = {
  attribute           : {
    recommanded       : 'Attribute *{0}* is recommanded*',
    required          : 'Attribute *{0}* is required'
  },

  element              : {
    not_found         : "Element *{0}* not found",
    exists            : "Element already exists *{0}* making default one {1}",
    defaulted         : "Element *{0}* not found, defaulted to {1}"
  },
  method              : {
    recommanded       : 'A method shoud be defined',
    not_found         : 'Method not found',
    unprocessed       : "The method *{0}* has not been processed",
    unexpected        : 'Method *{0}* should not be called'
  },
  argument            : {
    expected          : 'Expected *{0}* as options, got {1}',
    recommanded       : 'The attribute *{0}* should not be empty'
  },
  bad_value           : '*{0}* is not expected for *{1}*',
  noCvType            : 'No child view type has been specified',

  arguments           : {
    bad_value         : "Argument value unexpected",
    empty             : 'No argments specified',
    mal_formed        : "Mal-formed arguments",
    noListener        : "Listeners are not defined",
    noParentEl        : "No parent $el",
    recommanded       : 'Arguments recommendded',
    required          : 'Arguments required'
  },

  response            : {
    invalid           : 'Invalid response received',
    unexpected        : 'Unexpected response {0}'
  },


  pipe                : {
    no_listener       : "No nobody is listening to your pipe!!!",
    recommanded       : 'Pipe for *{0}* should not be empty'
  },

  object              : {
    missing           : "Missing object!!!",
    not_built         : 'Failed to buid data with key *{0}*',
    not_found         : 'No object or data has been found with Key *{0}*',
    broken            : 'Broken object hierarchy'
  },

  handler             : {
    stopped           : "{0} is not currently running"
  },

  validation          : {
    failed            : "Validation failed with : {0}",
    unsatified        : "Conditions *{0}* didn't match requirements"
  },

  attributes          : {
    missing           : "The model doesn't have expected attribute(s) : {0}",
    defaulted         : "The model doesn't have attribute {0}, defaulting to {1}"
  }
};

module.exports = {
  errors   : a,
  warnings : b
};
