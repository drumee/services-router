

<%= renderer.include('scripts.tpl') %>

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    console.log(`Loading LETC engine `, bootstrap());
    const router = document.getElementById('--router');
    if(!router){
      const el = document.createElement('div');
      el.setAttribute('id', "--router");
      document.body.appendChild(el);
    }

    const el = document.createElement('script');
    el.setAttribute('text', 'text/javascript');
    el.setAttribute('charset', "utf-8");
    el.setAttribute('crossorigin', "true");
    el.setAttribute('src', "https://<%= host %><%= app.location %>/app/dom.js");
    document.head.appendChild(el);
  }
};
