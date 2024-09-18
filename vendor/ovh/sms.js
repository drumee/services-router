const Backbone  = require('backbone');
const Jsonfile    = require('jsonfile');
const Path        = require('path');

class __sms_ovh extends Backbone.Model {

  /** 
   * OVH SMS API CONNECTOR
   * Require credential as follow
   * @param {object} 
   *  - @param {string} appKey  -- Application secret
   *  - @param {string} appSecret  -- Application secret
   *  - @param {string} consumerKey  -- Outbound message
   * See : https://docs.this.com/fr/sms/envoyer_des_sms_avec_lapi_ovh_en_nodejs/
  */
  constructor(...args) {
    super(...args);
    this.send = this.send.bind(this);
  }
  /** -------------------------------------------------------------------------- */
  initialize(o) {
    this.options = o;
    let credential_dir = process.env.credential_dir || "/etc/drumee/credential";
    const opt = Jsonfile.readFileSync(
      Path.resolve(credential_dir, 'ovh', 'sms.json')
    );
    this.connector = require('ovh')(opt)
    this.debug("ENV ------------ ", credential_dir, opt);
  }

  /** 
   * Send SMS message using OVH API
   * @param {object} 
   *  - @param {string} message  -- Outbound message
   *  - @param {array} receivers -- List of phone numbers 
  */
  send(o){
    let opt = {...this.options, ...o};
    const a = new Promise((resolve, reject)=> {
      this.connector.request('GET', '/sms', (error, serviceName)=> {
        if(error) {
          reject({error});
        }
        else {
          console.log("My account SMS is " + serviceName);
      
          // Send a simple SMS with a short number using your serviceName
          let cmd = `/sms/${serviceName}/jobs/`;
          let args = {
            message: opt.message,
            sender: "Drumee",
            receivers: opt.receivers
          };
          console.log(`Sending ${cmd}`, args);
          this.connector.request('POST', cmd, args, (err, result)=> {
            if(err){
              reject({error:err, message:result});
              return;
            } 
            resolve(result);
          });
        }
      });        
    });
    return a;
  }
}
module.exports = __sms_ovh;
