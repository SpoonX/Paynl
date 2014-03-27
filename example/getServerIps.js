var Paynl = require('../index.js'); // Replace '../index.js' with 'paynl' in your application

var pay = new Paynl();

pay.invoke('Validate/getPayServerIps/v1').done(function(response) {
  console.log(response);
});
