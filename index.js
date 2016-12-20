'use strict';
const MWS = require('mws-sdk-promises');
const _ = require('lodash');

function Mws (cred) {
  this.client = new MWS.Client(
    cred.access,
    cred.secret,
    cred.id,
    {
      authToken: cred.token,
      host: cred.host
    });
}

Mws.prototype = {
  reports
}

module.exports = (credentials) => new Mws(credentials);

function reports (reportType) {
  const rep = require('./lib/reports')
  return rep(this.client, reportType);
}
