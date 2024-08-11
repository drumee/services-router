

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
    el.type = '<%= type %>';
    el.setAttribute('charset', "utf-8");
    el.setAttribute('async', "");
    el.setAttribute('src', "<%= app.location %>/app/<%= app.entry %>");
    document.head.appendChild(el);
  }
};
