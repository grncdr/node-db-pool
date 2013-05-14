var db_pool = require('./lib/db-pool');

var dev = db_pool.pool('postgres.development');
var test = db_pool.pool('test');

console.log(db_pool.debug());

dev.query("SELECT 1", function (err, results) {
  console.log(results);

  // Terminate all active pools
  db_pool.closeAll();
});
