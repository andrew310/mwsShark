'use strict';
const MWS = require('mws-sdk-promises');

function Reports (client, reportType) {
  this.client = client;
  this.parent = this;
  this.paramsGet = {};
  this.paramsList = {};
  this.reqList = null;
  this.reqGet = null;

  this.paramsGet.ReportType = reportType;
  this.paramsList.ReportTypeList = reportType;
}

Reports.prototype = {
  list,
  latest,
  get,
  zip,
  exec,
  execGet
}

module.exports = (client, reportType) => new Reports(client, reportType);

function list (AvailableFromDate, callback) {
  this.paramsList.AvailableFromDate = AvailableFromDate;
  this.reqList = MWS.Reports.requests.GetReportList();

  return (callback) ? this.exec(callback) : this;
}

function get () {
  let callback
  Array.prototype.slice.call(arguments).map((arg) => {
    if (typeof arg === 'number' || typeof arg === 'string') {
      this.paramsGet.ReportId = arg;
    }
    else if (typeof arg === 'function') {
      callback = arg;
    }
  })

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
  if (!this.reqList) {
    return this.paramsGet.ReportId ? this.execGet(callback) : (() => {throw 'no list or get command found'})()
  }

  this.reqList.set(this.paramsList);
  this.client.invoke(this.reqList)
    .then((resp) => {
      const list = resp.GetReportListResponse.GetReportListResult[0].ReportInfo;
      if (list === undefined) return callback(null, 'no reports available')

      const reportObj = this.getLatest ? getLatest(list, 'AvailableDate') : list;
      if (!this.reqGet) return callback(null, reportObj)

      // set up request for specific report
      this.paramsGet.ReportId = reportObj.ReportId[0];
      this.execGet(callback);
    })
    .catch((err) => callback(err, null))
}

function execGet (callback) {
  this.reqGet.set(this.paramsGet);
  this.client.invoke(this.reqGet)
    .then(items => {
      if (items.ErrorResponse) return callback(items.ErrorResponse.Error[0], null)

      // does this eval lazy? if not change
      const report = _zipReport(items);
      const reportId = this.paramsGet.reportId;

      return this.zipReport ? callback(null, { report, reportId })
        : callback(null, { report: items, reportId });
    })
    .catch((err) => {
      return callback(err, null);
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
