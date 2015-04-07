# JavaScript Expensify API for Node.JS

A Node.JS module providing a wrapper for the Expensify API.

## Installation

  Install with the Node.JS package manager [npm](http://npmjs.org/) ![NPM version](https://badge.fury.io/js/expensify.png):

      $ npm install expensify

or

  Install via git clone:

      $ git clone git://github.com/brendannee/node-expensify.git
      $ cd node-expensify
      $ npm install

## Example

Generate an Expensify SSO for user 'testuser@test.com'.

```javascript
var Expensify = require('expensify');

var expensify = new Expensify({
  expensifyPartnerName: <YOUR EXPENSIFY_PARTNER_NAME>,
  expensifyPartnerPassword: <YOUR EXPENSIFY_PARTNER_PASSWORD>,
  expensifyAesKey: <YOUR EXPENSIFY_AES_KEY>,
  expensifyAesIv: <YOUR EXPENSIFY_AES_IV>
});


//Create and store a user is and secret for the the user you'd like to connect
var userId = 'testuser@test.com';
var userSecret = 'MyGreatSecret';

var sso = expensify.authenticate({
  userSecret: userSecret
});
```

Create an expense transaction using the sso created above.

```javascript
expensify.createDistanceTransaction({
  created: '2015-04-07',
  merchant: 'Tire Emporium',
  amount: 2299,
  currency: 'USD',
  comment: 'New tires for my car',
  sso: sso,
  partnerUserId: 'testuser@test.com'
}, function(e, body) {
  console.log('Transaction created');
});
```

Create a separate distanceTransaction for that user.

```javascript
expensify.createDistanceTransaction({
  created: '2015-04-07',
  distance: 2.3,
  units: 'Mi',
  comment: 'A trip to the store',
  sso: sso,
  partnerUserId: 'testuser@test.com'
}, function(e, body) {
  console.log('Distance Transaction created');
});
```

Upload a receipt

```javascript
expensify.uploadReceipt({
  file: 'R0lGODlhEAAQAKUAAAAAABbkKBfhKRXlJxfiKBjgKRndKhrbKxzYKxbjKBneKhrcKhvZKxzXLB7VLRjfKRzYLB3WLBrbKh7ULR/SLh3VLR/TLSDQLiHOLyLLMCTJMB/RLiHPLyLMLyPKMCTIMSbFMifDMyXGMSjBMym/NCfCMyq9NCu7NSXGMifDMim+NCq8NSu5NSu6Nf///////////////////////////////////////////////////////////////////////yH5BAEKAD8ALAAAAAAQABAAAAZlwJ9wSCwafwDAsZgMCJJL5IBQMBwQSiMgIVAsGA1HlvkwACAR6BEgYQAmFLW2UbFcMBnNmLnhdDwfICF7REkfIgAjJIRDSSAlACYnjEgoKSMqKywslAAlJCYtm5RCSaOkhahRRkEAOw==',
  created: '2015-04-07',
  merchant: 'Tire Emporium',
  amount: 2299,
  currency: 'USD',
  comment: 'New tires for my car',
  sso: sso,
  partnerUserId: 'testuser@test.com'
}, function(e, body) {
  console.log('Receipt uploaded');
});
```

```

## LICENSE

MIT license. See the LICENSE file for details.
