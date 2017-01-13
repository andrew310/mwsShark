'use strict';
const MWS = require('mws-sdk-promises');
const Promise = require('bluebird');
const _ = require('lodash');

function Reports (client, reportType) {
  this.client = client;
  this.parent = this;
  this.paramsGet = {};
  this.paramsList = {};
  this.reqList = null;
  this.reqGet = null;

  this.paramsList.ReportTypeList = reportType;
}

Reports.prototype = {
  list,
  listByNextToken,
  loop,
  latest,
  get,
  zip,
  exec,
  execGet,
  execLoop
}

module.exports = (client, reportType) => new Reports(client, reportType);

function list (AvailableFromDate, callback) {
  this.paramsList.AvailableFromDate = AvailableFromDate;
  this.reqList = MWS.Reports.requests.GetReportList();

  return (callback) ? this.exec(callback) : this;
}

function listByNextToken (token, callback) {
  this.paramsList.NextToken = token;
  this.reqList = MWS.Reports.requests.GetReportListByNextToken();

  return (callback) ? this.exec(callback) : this;
}

function loop (callback) {
  this.reqList = 'loop';

  return (callback) ? this.exec(callback) : this;
}

function get () {
  let callback;
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
  if (!this.reqList) {
    this.reqList = MWS.Reports.requests.GetReportList();
  }
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

  if (this.reqList === 'loop') {
    return this.execLoop(callback);
  }

  this.reqList.set(this.paramsList);
  this.client.invoke(this.reqList)
    .then((resp) => {
      // Makes this func work with GetReportList and GetReportListByNextToken.
      const extractedResult = _extractResult(resp);
      const hasNext = extractedResult.HasNext[0];

      let nextToken = {};

      if (hasNext) {
        nextToken = extractedResult.NextToken[0];
      }

      const list = extractedResult.ReportInfo;
      if (list === undefined) return callback(null, 'no reports available')

      const items = this.getLatest ? getLatest(list, 'AvailableDate') : list;
      if (!this.reqGet) return callback(null, { items, nextToken })

      // set up request for specific report
      this.paramsGet.ReportId = items.ReportId[0];
      this.execGet(callback);
    })
    .catch((err) => callback(err, null))
}

function _extractResult(resp) {
  if (resp.GetReportListByNextTokenResponse) {
    return resp.GetReportListByNextTokenResponse.GetReportListByNextTokenResult[0];
  } else if (resp.GetReportListResponse){
    return resp.GetReportListResponse.GetReportListResult[0];
  } else {
    console.log(resp);
  }
}

function execLoop (callback) {
  this.reqList = MWS.Reports.requests.GetReportList();
  this.reqList.set(this.paramsList);
  this.client.invoke(this.reqList)
    .then((resp) => {
      // Makes this func work with GetReportList and GetReportListByNextToken.
      const extractedResult = _extractResult(resp);
      const client = this.client;
      let hasNext = extractedResult.HasNext[0];

      let sum = 0;

      let nextToken = '';
      const loopReq = MWS.Reports.requests.GetReportListByNextToken();

      if (hasNext) {
        nextToken = extractedResult.NextToken[0];
      }

      let items = [];

      promiseWhile(() => hasNext && sum < 5, function() {
        loopReq.set({NextToken: nextToken})
        return new Promise(function(resolve, reject) {
          client.invoke(loopReq).then((r) => {
            const ex = _extractResult(r);
            hasNext = _hasNext(ex);
            if (hasNext) {
              nextToken = ex.NextToken[0];
            }

            ex.ReportInfo.map((item) => {
              items.push(item);
            })

            // sum++;
            resolve();
          })
        })
      }).then(() => {
        return callback(null, items)
      })
    })
    .catch((err) => callback(err, null))
}

function _hasNext(obj) {
  if (obj.hasOwnProperty('HasNext')) {
    return obj.HasNext[0] === 'false' ? false : true;
  } else {
    return false;
  }
}

function execGet (callback) {
  this.reqGet.set(this.paramsGet);
  this.client.invoke(this.reqGet)
    .then(items => {
      if (items.ErrorResponse) return callback(items.ErrorResponse.Error[0], null)

      const reportId = this.paramsGet.ReportId;

      if (this.zipReport) {
        const report = _zipReport(items);
        return callback(null, { report, reportId });
      } else {
        return callback(null, { report: items, reportId });
      }
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

// source: https://gist.github.com/victorquinn/8030190
function promiseWhile (condition, action) {
    var resolver = Promise.defer();

    var loop = function() {
        if (!condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };

    process.nextTick(loop);

    return resolver.promise;
};
