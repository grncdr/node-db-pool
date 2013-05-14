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
var pools = [];

var defaults = {
  postgres: {
    host: "localhost",
    database: "postgres",
    port: 5432,
    min: 5,
    max: 15
  }
};

var load = exports.load = function (filename) {
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

function connStr(db, env) {
  var conn = conns[db][env];
  var userDefaults = conns[db].defaults || {};
  Object.keys(defaults[db]).forEach(function (key) {
    conn[key] = conn[key] || userDefaults[key] || defaults[db][key];
  });
  var connString = db + '://' + conn.username + (conn.password ? ':' + conn.password : '') + '@' + conn.host + (conn.port ? ':' + conn.port : '') + '/' + conn.database;
  return connString;
}

function createPool(db, env) {
  var conn = conns[db][env];
  conn.connStr = connStr(db, env);
  conn.pool = anydb.createPool(conn.connStr, { min: conn.min, max: conn.max });
  pools.push(conn.pool);
  return conn.pool;
}

exports.closeAll = function closeAll() {
  pools.forEach(function (pool) { pool.close(); });
};

exports.pool = function pool(name) {
  var names, db, env;
  if (conns === undefined) {
    load();
  }
  names = name ? name.split('.') : [];
  if (names.length > 1) {
    // Assume postgres.development or similar
    db = names[0];
    env = names[1];
  } else {
    // Use the first defined database hash
    db = Object.keys(conns)[0];
    // And use supplied definition (development|test|production) or from NODE_ENV=development, default to development
    env = names[0] || process.env.NODE_ENV || 'development';
  }
  if (conns[db][env].pool) {
    return conns[db][env].pool;
  }
  return createPool(db, env);
};
