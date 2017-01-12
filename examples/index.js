const creds = {
  access: "YOUR_CREDS_HERE",
  secret: "YOUR_CREDS_HERE",
  id: "YOUR_CREDS_HERE",
  token: "YOUR_CREDS_HERE"
}

const mws = require('..')(creds);

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
