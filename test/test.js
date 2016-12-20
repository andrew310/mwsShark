const should = require('should');
const moment = require('moment');

var creds = {
  access: '123access',
  token: '123token',
  id: '123id',
  secret: '123secret',
  host: 'mws-eu.amazonservices.com'
};


describe('constructor', function(){
  describe('given an obj with credentials', function(){
    it('should set up mws client', function(){
      const mws = require('..')(creds);
      mws.client.accessKeyId.should.eql('123access');
      mws.client.secretAccessKey.should.eql('123secret');
      mws.client.merchantId.should.eql('123id');
      mws.client.authToken.should.eql('123token');
      mws.client.host.should.eql('mws-eu.amazonservices.com');
    })
  })
})

describe('reports constructor', function(){
  describe('given no parameters', function(){
    it('should register report type', function(){
      const mws = require('..')(creds);
      const test = mws.reports('_GET_MERCHANT_LISTINGS_DATA_');
      console.log(test)
      test.paramsList.ReportTypeList.should.eql('_GET_MERCHANT_LISTINGS_DATA_');
    })
  })
})


describe('list', function(){
  describe('given a date string and callback', function(){
    it('should register available from date to argsList', function(){
      const mws = require('..')(creds);
      const startDate = '2016-11-07T19:03:00.195Z';
      const test = mws.reports().list(startDate);
      test.paramsList.AvailableFromDate.should.eql(startDate);
    })
  })
})
