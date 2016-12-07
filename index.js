'use strict';
const MWS = require('mws-sdk-promises');
const Promise = require('bluebird');
const _ = require('lodash');

function Mws (cred) {
  this.client = new MWS.Client(
    cred.access,
    cred.secret,
    cred.id,
    {
      authToken: cred.token
    });

  this.parent = this;
  this.argsGet = {};
  this.argsList = {};
  this.reqList = null;
  this.reqGet = null;
  this.reportIds = [];
  this.reportId = null;
}

Mws.prototype = {
  reports,
  list,
  latest,
  get,
  zip,
  exec
}

function exec () {

}

module.exports = (credentials) => new Mws(credentials);

function reports (ReportType) {
  this.argsGet.ReportType = ReportType;
  this.argsList.ReportTypeList = ReportType;
  return this;
}

function list (AvailableFromDate, callback) {
  this.argsList.AvailableFromDate = AvailableFromDate;
  this.reqList = MWS.Reports.requests.GetReportList();

  return (callback) ? this.exec(callback) : this;
}

function get (callback) {
  this.reqGet = MWS.Reports.requests.GetReport();
  return (callback) ? this.exec(callback) : this;
}

function latest (callback) {
  this.getLatest = true;
  return (callback) ? this.exec(callback) : this;
}

function zip (callback) {
  this.zipReport = true;
  return (callback) ? this.exec(callback) : this;
}

function exec (callback) {
  this.reqList.set(this.argsList);
  const list = this.client.invoke(this.reqList);
  list
    .then((resp) => {
      const items = resp.GetReportListResponse.GetReportListResult[0].ReportInfo;
      // this should get all ?
      const reportObj = this.getLatest ? getLatest(items, 'AvailableDate') : items;

      if (!this.reqGet) {
        return callback(reportObj);
      }

      const reportId = reportObj.ReportId[0];
      this.argsGet.ReportId = reportId;
      this.reqGet.set({ReportId: this.argsGet.ReportId});
      const prom = this.client.invoke(this.reqGet);
      prom
        .then(items => {
          return this.zipReport ? callback(_zipReport(items), reportId) : callback(items, reportId);
        });
    })
}

function getLatest (arr, key) {
  return arr.reduce((a, b) => {
    return a[key][0] > b[key][0] ? a : b;
  });
}

const _zipReport = (res) => {
  const arr = res.trim().split('\n');
  const headers = arr[0].split('\t')
  const body = _.slice(arr, 1, arr.length);
  const group = body.map((row) => {
    const values = row.split('\t');
    return values.length > 1 ? _.zipObject(headers, values) : false ;
  })
  return group;
}
