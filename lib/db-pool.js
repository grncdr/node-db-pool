/*
 * db-pool
 * https://github.com/mark/node-db-pool
 *
 * Copyright (c) 2013 Mark Selby
 * Licensed under the MIT license.
 */

'use strict';

var anydb = require('any-db');
var path = require('path');
var conns;
// Keep a reference to created pools for cleanup
var pools = exports.pools = [];

var defaults = {
  postgres: {
    database: undefined,
    username: undefined,
    password: undefined,
    host: "localhost",
    driver: "postgres",
    port: 5432,
    min: 5,
    max: 15
  }
};

// Load config file
var config = exports.config = function (filename) {
  filename = path.join(process.cwd(), filename || 'config/database.js');
  try {
    conns = require(filename);
  } catch (err) {
    console.log('Does ' + filename + ' exist, and does it look similar to config/database.js.sample?');
    throw (err);
  }
};

exports.debug = function debug() {
  return conns;
};

// Build a connection string from target db + env hash
function connStr(db, env) {
  var conn = conns[db][env];
  var userDefaults = conns[db].defaults || {};

  // Merge default connection values
  Object.keys(defaults[userDefaults.driver]).forEach(function (key) {
    conn[key] = conn[key] || userDefaults[key] || defaults[userDefaults.driver][key];
  });
  var connString = conn.driver + '://' + conn.username + (conn.password ? ':' + conn.password : '') + '@' + conn.host
    + (conn.port ? ':' + conn.port : '') + '/' + conn.database;
  return connString;
}

// Create the connection pool via any-db
function createPool(db, env) {
  var conn = conns[db][env];
  conn.connStr = connStr(db, env);
  conn.pool = anydb.createPool(conn.connStr, {
    min: conn.min,
    max: conn.max,
    onConnect: function (conn, done) {
      done(null, conn);
    },
    reset: function (conn, done) {
      done(null);
    }
  });
  // Remember all connection pools for easy termination
  pools.push(conn.pool);
  return conn.pool;
}

// Close all connection pools
exports.closeAll = function closeAll() {
  pools.forEach(function (pool) { pool.close(); });
};

// Return specified pool, create if it doesn't exist
exports.pool = function pool(name) {
  var names, db, env;
  // Load config file
  if (conns === undefined) {
    config();
  }
  names = name ? name.split('.') : [];
  if (names.length > 1) {
    // Assume name is postgres.development or similar
    db = names[0];
    env = names[1];
  } else {
    // Use the first defined database hash
    db = Object.keys(conns)[0];
    // And use supplied definition (development|test|production) or from NODE_ENV=development, default to development
    env = names[0] || process.env.NODE_ENV || 'development';
  }
  try {
    if (conns[db][env].pool) {
      return conns[db][env].pool;
    }
  } catch (e) {
    throw 'Database definition ' + name + ' doesn\'t seem to exist';
  }
  return createPool(db, env);
};
