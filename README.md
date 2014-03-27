# Paynl
This is a very simple (both built, and to use) module to communicate with the [PayNL](http://pay.nl/) API.

## Installation
Super simple. Just do the following:

`npm install paynl --save`

## Usage
Usage is pretty straight forward. There aren't that many methods, which is what makes this module so easy to use.

### No handshake
If you don't need to use methods that require a handshake, you can create a new instance like so:

```js
var Paynl = require('paynl');

var pay = new Paynl();

pay.invoke('Validate/getPayServerIps/v1').done(function(response) {
  console.log(response);
});

```

### Handshake
If you wish to use methods that require authentication you must instantiate `Paynl` with params.

#### AccountId and token (recommended)
You can authenticate using your [API token](https://docs.pay.nl/api_token).

```js
var Paynl = require('paynl');

var pay = new Paynl({
  accountId: '1234',
  token    : '7110eda4d09e062aa5e4a390b0a572ac0d2c0220'
});

pay.invoke('Session/getPaymentOptions/v2', {
  programId : 1234,
  websiteId : 1234
}).then(function(response) {
  console.log(response);
}, function(error) {
  console.log('We got an error!', error);
});

```

#### Username, password and companyId
It's also possible to login using your credentials.

```js
var Paynl = require('paynl');

var pay = new Paynl({
  username : 'YOUR_USERNAME',
  password : 'YOUR_PASSWORD',
  companyId: 'YOUR_COMPANY_ID'
});

pay.invoke('Session/getPaymentOptions/v2', {
  programId : 1234,
  websiteId : 1234
}).then(function(response) {
  console.log(response);
}, function(error) {
  console.log('We got an error!', error);
});

```

### API
To check out all possible API methods go to [the pay.nl API docs](https://docs.pay.nl/docpanel/api/).

**Note:** You can omit the ip-address. This module adds it for you.
