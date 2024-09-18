const Backbone  = require('backbone');
const Jsonfile    = require('jsonfile');
const Path        = require('path');

const opt = Jsonfile.readFileSync(
  Path.resolve('/etc/drumee/credential', 'ovh', 'sms.json')
);
const connector = require('ovh')(opt)
console.log("ENV ------------ ", opt);

connector.request('GET', '/sms', (error, serviceName)=> {
  if(error) {
    reject({error});
  }
  else {
    console.log("My account SMS is " + serviceName);

    // Send a simple SMS with a short number using your serviceName
    let cmd = `/sms/${serviceName}/jobs/`;
    let args = {
      message: "Coucou",
      sender: "Drumee",
      receivers: [ '+33607152508' ]
    };
    console.log(`Sending ${cmd}`, args);
    connector.request('POST', cmd, args, (err, result)=> {
      if(err){
        console.error({error:err, message:result});
        return;
      } 
      console.log(result);
    });
  }
})
