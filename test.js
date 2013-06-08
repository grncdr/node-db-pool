var db_pool = require('./lib/db-pool');

var dev = db_pool.pool('app1.development');
var test = db_pool.pool('test');
var default1 = db_pool.pool();
var default2 = db_pool.pool('production');
var dev = db_pool.pool('app2.development');

console.log(db_pool.debug());

dev.query("SELECT ROUND(RANDOM() * 100) AS number", function (err, results) {
  console.log(results);

  console.log(db_pool.pools.length + ' pools created');
  // Terminate all active pools
  db_pool.closeAll();
});

var grunt = require('grunt');
console.log(grunt.file)