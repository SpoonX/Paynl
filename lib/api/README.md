# Api
This directory contains the api `namespaces`. These files are used to set method specific options.

## Usage
Simply specify the method/version as key, and whether or not this method requires a handshake through a boolean.
Example (namespace Validate, method getPayServerIps, version 1, doesn't require a handshake):

```js
module.exports = {
  'getPayServerIps/v1' : false
};
```
