var pool = require('./lib/db-pool');

pool.pool('development');
pool.pool('test');

console.log(pool.debug());

pool.closeAll();
