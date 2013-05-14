# db-pool [![Build Status](https://secure.travis-ci.org/mark/node-db-pool.png?branch=master)](http://travis-ci.org/mark/node-db-pool)

Easily create a Postgres/MySQL connection pool

## Getting Started
Install the module with: `npm install db-pool`

## Configuration
Create a config/database.js containing something like (postgres only for now)
```javascript
exports.postgres = {
  defaults: {
    min: 5,
    max: 20
  },
  development: {
    database: "development",
    username: "username",
    password: "pass"
  },
  production: {
    database: "production",
    username: "username",
    password: "pass",
    port: 9999
  },
  test: {
    database: "test",
    username: "username",
    password: "pass",
    host: "some.hostname",
    min: 15
  }
};
```

## Example
```javascript
var db_pool = require('db-pool');

// Create a pools to a development database
var dev = db_pool.pool('development'); // or db_pool.pool('postgres.development');

// Create another pool to a different database
var test = db_pool.pool('test');

// Terminate all active pools
db_pool.closeAll();
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Mark Selby  
Licensed under the MIT license.
