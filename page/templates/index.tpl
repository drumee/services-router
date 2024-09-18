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
    <meta http-equiv="Content-Language" content="<%= language %>,en">
    <meta name="description" content="<%= description %>">
    <meta name="keywords" content="<%= keywords %>">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
    <meta http-equiv="Cache-Control" content="no-cache" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <% _.each(meta, function(m) { %>
      <meta name="<%= m.name %>" content="<%= m.content %>">
    <% }); %>
    <title>
      <%= title %>
    </title>
    <link rel="icon" href="<%= icon %>" type="image/png">
    <link rel="stylesheet" href="/-/static/styles/loader.css" media="screen"></link>

    <script>
    <%= renderer.include('scripts.tpl') %>
    </script>

    <% if (typeof(loader) !== "undefined" && loader) { %>
      <script defer type="text/javascript" src="<%= loader %>"></script> 
    <% } %>

  </head>

  <body style="background-color:#f6f6f6;" 
    data-instance="<%= instance %>" 
    data-head="<%= app.head %>" 
    data-hash="<%= app.hash %>" 
    data-timestamp="<%= app.timestamp %>">
    <div class="margin-auto <%= ident %>-top" id="--router">
      <div class="drumee-loading-wrapper">
        <div class="loader-wrapper">
          <div class="loader"></div>
          <div class="loader"></div>
          <div class="loader"></div>
          <div class="loader"></div>
          <div class="loader"></div>
        </div>
      </div>
    </div>
    <div class="margin-auto" id="--wrapper"></div>
    <script type="text/javascript" src="<%= app.location %>/app/<%= app.entry %>" crossorigin="true"></script> 
  </body>
</html>
