'use strict';

var crypto = require('crypto');
var request = require('request');
var expensifyAPIURL = 'https://www.expensify.com/api/v1/';

var Client = module.exports = function(config) {
  this.config = config;
};

(function() {
  /**
   *  Client#authenticate(options) -> null
   *    - options (Object): Object containing the Expensify user secret
   *      - userSecret (String): Expensify user secret
   *
   *  ##### Example
   *
   *    expensify.authenticate({
   *      userSecret: 'test1324'
   *    });
   **/
  this.authenticate = function(options) {
    if(!options.userSecret) {
      throw new Error('No Expensify user secret provided');
    }

    if(!this.config.expensifyPartnerPassword) {
      throw new Error('No Expensify partner password provided');
    }

    if(!this.config.expensifyAesKey) {
      throw new Error('No Expensify AES key provided');
    }

    if(!this.config.expensifyAesIv) {
      throw new Error('No Expensify AES IV provided');
    }

    var expires = Math.floor(new Date().getTime() / 1000) + 60 * 30;
    var ssoJSON = {
      expires: expires,
      partnerPassword: this.config.expensifyPartnerPassword,
      partnerUserSecret: options.userSecret
    };
    var text = JSON.stringify(ssoJSON);

    var key = new Buffer(this.config.expensifyAesKey, 'hex');
    var iv = new Buffer(this.config.expensifyAesIv, 'hex');

    var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    var sso = cipher.update(text, 'utf-8', 'hex');
    sso += cipher.final('hex');

    return sso;
  };

  /**
   *  Client#authorizeUrl(options) -> null
   *    - options (Object): Object containing userId and optional exitTo
   *      - sso (String): Expensify sso
   *      - partnerUserId (String): Partner user ID
   *      - exitTo (String): URL to redirect user to
   *
   *  ##### Example
   *
   *    expensify.authorizeUrl({
   *      sso: '675sd98769sd69sd',
   *      userId: 'testuser@test.com',
   *      exitTo: 'http://mysite.com/expensify/redirect'
   *    });
   **/
  this.authorizeUrl = function(options) {
    if(!options.sso) {
      throw new Error('No Expensify SSO available');
    }

    if(!this.config.expensifyPartnerName) {
      throw new Error('No Expensify partner name provided');
    }

    if(!options.partnerUserId) {
      throw new Error('No partner user id provided');
    }

    var authorizeUrl = expensifyAPIURL;

    authorizeUrl += '?action=Auth&sso=' + options.sso;
    authorizeUrl += '&partnerName=' + this.config.expensifyPartnerName;
    authorizeUrl += '&partnerUserID=' + options.partnerUserId;

    if(options.exitTo) {
      authorizeUrl += '&exitTo=' + options.exitTo;
    }

    return authorizeUrl;
  };

  /**
   *  Client#createTransaction(transaction) -> null
   *    - transaction (Object): Object containing transaction
   *      - created (String): Date of the transaction
   *      - merchant (String): Merchant Name
   *      - amount (Integer): Amount in cents as an integer
   *      - currency (String): ISO 4217 currency code of the transaction
   *      - comment (String): Tranaction comment
   *      - sso (String): Expensify sso
   *      - partnerUserId (String): Partner user ID
   *
   *  ##### Example
   *
   *    expensify.createTransaction({
   *      created: '2015-04-07',
   *      merchant: 'Tire Emporium',
   *      amount: 2299,
   *      currency: 'USD',
   *      comment: 'New tires for my car',
   *      sso: '675sd98769sd69sd',
   *      partnerUserID: 'testuser@test.com'
   *    });
   **/
  this.createTransaction = function(transaction, cb) {
    var self = this;

    if(!transaction.sso) {
      cb(new Error('No Expensify SSO available'));
    }

    if(!this.config.expensifyPartnerName) {
      cb(new Error('No Expensify partner name provided'));
    }

    if(!transaction.partnerUserId) {
      cb(new Error('No partner user id provided'));
    }

    var url = expensifyAPIURL + '?action=CreateTransaction';

    var expenseTransaction = {
      action: 'CreateTransaction',
      distanceTransaction: JSON.stringify({
        created: transaction.created,
        merchant: transaction.merchant,
        amount: transaction.amount,
        currency: transaction.currency
      }),
      comment: transaction.comment,
      sso: transaction.sso,
      partnerName: this.config.expensifyPartnerName,
      partnerUserID: transaction.partnerUserId
    };

    request.post({url: url, form: expenseTransaction}, function(e, r, body) {
      if(e) cb(e);

      if(r.statusCode === 200) {
        cb(null, body);
      } else if(r.statusCode === 407) {
        cb(new Error('Expensify sso expired'));
      } else {
        return cb(new Error(body || 'Error creating distance transaction'));
      }
    });
  };

  /**
   *  Client#createDistanceTransaction(transaction) -> null
   *    - transaction (Object): Object containing distance transaction
   *      - created (String): Date of the trip
   *      - distance (Number): distance
   *      - units (String): Either 'Mi' or 'Km'
   *      - comment (String): Tranaction comment
   *      - sso (String): Expensify sso
   *      - partnerUserId (String): Partner user ID
   *
   *  ##### Example
   *
   *    expensify.createDistanceTransaction({
   *      created: '2015-04-07',
   *      distance: 1.2,
   *      units: 'Mi',
   *      comment: 'A trip to the store',
   *      sso: '675sd98769sd69sd',
   *      partnerUserID: 'testuser@test.com'
   *    });
   **/
  this.createDistanceTransaction = function(transaction, cb) {
    var self = this;

    if(!transaction.sso) {
      cb(new Error('No Expensify SSO available'));
    }

    if(!this.config.expensifyPartnerName) {
      cb(new Error('No Expensify partner name provided'));
    }

    if(!transaction.partnerUserId) {
      cb(new Error('No partner user id provided'));
    }

    var url = expensifyAPIURL + '?action=CreateDistanceTransaction';

    var distanceTransaction = {
      action: 'CreateDistanceTransaction',
      distanceTransaction: JSON.stringify({
        created: transaction.created,
        distance: transaction.distance,
        units: 'Mi'
      }),
      comment: transaction.comment,
      sso: transaction.sso,
      partnerName: this.config.expensifyPartnerName,
      partnerUserID: transaction.partnerUserId
    };

    request.post({url: url, form: distanceTransaction}, function(e, r, body) {
      if(e) cb(e);

      if(r.statusCode === 200) {
        cb(null, body);
      } else if(r.statusCode === 407) {
        cb(new Error('Expensify sso expired'));
      } else {
        return cb(new Error(body || 'Error creating expense'));
      }
    });
  };

  /**
   *  Client#uploadReceipt(transaction) -> null
   *    - transaction (Object): Object containing transaction
   *      - file (base64 image): base64 encoded image payload
   *      - created (String): Date of the trip
   *      - merchant (String): Merchant name
   *      - amount (Integer): Amount in cents as an integer
   *      - currency (String): ISO 4217 currency code of the transaction
   *      - comment (String): Tranaction comment
   *      - sso (String): Expensify sso
   *      - partnerUserId (String): Partner user ID
   *
   *  ##### Example
   *
   *    expensify.uploadReceipt({
   *      file: 'iVBORw0KGgoAAAANSUhEUgAAAPAAAAAnCAM30jAAAAAElFTkSuQmCC',
   *      created: '2015-04-07',
   *      merchant: 'Tire Emporium',
   *      amount: 2299,
   *      currency: 'USD',
   *      comment: 'A trip to the store',
   *      sso: '675sd98769sd69sd',
   *      partnerUserID: 'testuser@test.com'
   *    });
   **/
  this.uploadReceipt = function(transaction, cb) {
    var self = this;

    if(!transaction.sso) {
      cb(new Error('No Expensify SSO available'));
    }

    if(!this.config.expensifyPartnerName) {
      cb(new Error('No Expensify partner name provided'));
    }

    if(!transaction.partnerUserId) {
      cb(new Error('No partner user id provided'));
    }

    var url = expensifyAPIURL + '?action=UploadReceipt';

    var uploadTransaction = {
      action: 'UploadReceipt',
      file: transaction.file,
      transaction: JSON.stringify({
        created: transaction.created,
        merchant: transaction.merchant,
        amount: transaction.amount,
        currency: transaction.currency
      }),
      comment: transaction.comment,
      sso: transaction.sso,
      partnerName: this.config.expensifyPartnerName,
      partnerUserID: transaction.partnerUserId
    };

    request.post({url: url, form: uploadTransaction}, function(e, r, body) {
      if(e) cb(e);

      if(r.statusCode === 200) {
        cb(null, body);
      } else if(r.statusCode === 407) {
        cb(new Error('Expensify sso expired'));
      } else {
        return cb(new Error(body || 'Error uploading receipt'));
      }
    });
  };

  /**
   *  Client#fetchReceipt(transaction) -> null
   *    - transaction (Object): Object containing transaction
   *      - location (String): URL of hosted image
   *      - created (String): Date of the trip
   *      - merchant (String): Merchant name
   *      - amount (Integer): Amount in cents as an integer
   *      - currency (String): ISO 4217 currency code of the transaction
   *      - comment (String): Tranaction comment
   *      - sso (String): Expensify sso
   *      - partnerUserId (String): Partner user ID
   *
   *  ##### Example
   *
   *    expensify.fetchReceipt({
   *      location: 'http://s3.amazon.com/image.gif',
   *      created: '2015-04-07',
   *      merchant: 'Tire Emporium',
   *      amount: 2299,
   *      currency: 'USD',
   *      comment: 'A trip to the store',
   *      sso: '675sd98769sd69sd',
   *      partnerUserID: 'testuser@test.com'
   *    });
   **/
  this.fetchReceipt = function(transaction, cb) {
    var self = this;

    if(!transaction.sso) {
      cb(new Error('No Expensify SSO available'));
    }

    if(!this.config.expensifyPartnerName) {
      cb(new Error('No Expensify partner name provided'));
    }

    if(!transaction.partnerUserId) {
      cb(new Error('No partner user id provided'));
    }

    var url = expensifyAPIURL + '?action=FetchReceipt';

    var fetchTransaction = {
      action: 'FetchReceipt',
      location: transaction.location,
      transaction: JSON.stringify({
        created: transaction.created,
        merchant: transaction.merchant,
        amount: transaction.amount,
        currency: transaction.currency
      }),
      comment: transaction.comment,
      sso: transaction.sso,
      partnerName: this.config.expensifyPartnerName,
      partnerUserID: transaction.partnerUserId
    };

    request.post({url: url, form: fetchTransaction}, function(e, r, body) {
      if(e) cb(e);

      if(r.statusCode === 200) {
        cb(null, body);
      } else if(r.statusCode === 407) {
        cb(new Error('Expensify sso expired'));
      } else {
        return cb(new Error(body || 'Error fetching receipt'));
      }
    });
  };

}).call(Client.prototype);
