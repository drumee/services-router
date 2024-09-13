<!DOCTYPE html>
<!--
 ____  _ __ _   _ _   _  ___  ___
|  _ \| '__| | | | \_/ |/ _ \/ _ \
| |_) | |  | |_| | | | | \__/ \__/
|____/|_|  (_____|_| |_|\___|\___|

                         
 -->

<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset=UTF-8>
    <meta http-equiv="Content-Type" content="text/html">
    <meta http-equiv="Cache-Control" Content="Public">
    <meta http-equiv="Content-Language" content="<%= language %>,en">
    <meta name="description" content="<%= description %>">
    <meta name="keywords" content="<%= keywords %>">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <title>
      <%= title %>
    </title>
    <link rel="icon" href="<%= icon %>" type="image/png">
    <link rel="stylesheet" href="/-/static/styles/loader.css" media="screen"></link>
    <script>
      var xia_lang = "<%= language %>";
      var verbose = 1;  
      const __d = {
        lang          : "<%= language %>",
        ident         : "<%= ident %>",
        uid           : "<%= uid %>",
        service       : "<%= svc_location %>",
        ws_path       : "<%= ws_location %>",
        access        : "<%= access %>",
        domain        : "<%= domain %>",
        debug         : {}
      };
      const __UI_TEMPLATES__ = "<%= templates %>"
    </script>
  </head>

  <body style="background-color: white" 
    data-instance="<%= instance %>" 
    data-head="<%= app.head %>" 
    data-hash="<%= app.hash %>" 
    data-timestamp="<%= app.timestamp %>">
    <svg style="display:none;" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="5" r="4">
        <desc><%= description %></desc>
      </circle>
    </svg>
    <div class="margin-auto <%= ident %>-top" id="--router">
      <div class="unsupported-main" style="width:100vw; height:100vh;">
        <div class="unsupported-title">
          <span><%= _unsupported_ua %></span>
        </div>
        <% _.each(browsers, function(item) { %>
          <div class="supported-browser">
            <span class="name"><%= item.name %></span> 
            <span class="version"><%= item.version %></span> 
            <a href=<%= item.link %> class="unsupported_link"><%= item.link %></a> 
          </div>
        <% }) %>
        <div class="unsupported-signature"><%= _drumee_team %></div>
      </div>
    </div>
    <div class="margin-auto" id="--wrapper"></div>
  </body>
</html>
