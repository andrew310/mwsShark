const creds = {
  access: "ENTER_YOUR_CREDS",
  secret: "ENTER_YOUR_CREDS",
  id: "ENTER_YOUR_CREDS",
  token: "ENTER_YOUR_CREDS"
}

// Require mwsShark and pass in credentials.
const mws = require('..')(creds);

const token = 'ENTER_REPORT_NEXT_TOKEN_HERE';

// Most basic request, list available reports of all types.
mws
  .reports()
  .list()
  .exec((err, items) => {
    if (err) {
      console.error(err);
      process.exit();
    }
    console.log(items)
  })

// Request to list reports of specific type.
mws
  .reports('_GET_FBA_ESTIMATED_FBA_FEES_TXT_DATA_')
  .list()
  .exec((err, items) => {
    if (err) {
      console.error(err);
      process.exit();
    }
    console.log(items)
  })

// Request to get latest report.
mws
  .reports('_GET_FBA_ESTIMATED_FBA_FEES_TXT_DATA_')
  .latest()
  .get()
  .exec((err, items) => {
    if (err) {
      console.error(err);
      process.exit();
    }
    console.log(items)
  })

// List reports by next token (pass token as string)
mws
  .reports()
  .listByNextToken(token)
  .exec((err, items) => {
    if (err) {
      console.error(err);
      process.exit();
    }
    console.log(items)
  })
