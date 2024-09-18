
  var xia_lang = "<%= language %>";

  const bootstrap = function() {
    return {
      access        : "<%= access %>",
      appHash       : "<%= app.hash %>",
      appRoot       : "<%= appRoot %>",
      arch          : "<%= arch %>",
      area          : "<%= area %>",
      connection    : "<%= connection %>",
      endpoint      : "<%= endpointPath %>/",
      endpointName  : "<%= instance_name %>",
      endpointPath  : "<%= endpointPath %>/",
      ident         : "<%= ident %>",
      instance      : "<%= instance_name %>",
      instance_name : "<%= instance_name %>",
      keysel        : "<%= keysel %>",
      lang          : "<%= language %>",
      main_domain   : "<%= main_domain %>",
      mfs_base      : "<%= endpointPath %>/",
      mfsRootUrl    : `<%= endpointPath %>/`,
      online        : 1,
      pdfworker     : "<%= pdfworker %>",
      service       : "<%= servicePath %>?",
      serviceApi    : "<%= servicePath %>?",
      servicePath   : "<%= servicePath %>",
      serviceUrl    : "https://<%= main_domain %><%= servicePath %>?",
      signed_in     : "<%= signed_in %>",
      static        : "<%= appRoot %>/static/",
      svc           : "<%= svcPath %>",
      uid           : "<%= uid %>",
      user_domain   : "<%= user_domain %>",
      vdo           : "<%= vdoPath %>",
      websocketApi  : "wss://<%= main_domain %><%= websocketPath %>",
      websocketPath : "<%= websocketPath %>",
    };
  }

  const DEBUG =  {};

