/*
 * db-pool
 * https://github.com/mark/node-db-pool
 *
 * Copyright (c) 2013 Mark Selby
 * Licensed under the MIT license.
 */

'use strict';

var anydb = require('any-db');
var grunt = require('grunt');
var path = require('path');
var util = require('util');

// This holds the object read from config/database.yml (or the user specified config file)
var connectionConfig;
// Keep a reference to created pools for cleanup
var pools = exports.pools = [];

// Defaults for specific drivers
var defaults = {
  postgres: {
    database: undefined,
    username: undefined,
    password: undefined,
    host: 'localhost',
    driver: 'postgres',
    port: 5432,
    min: 5,
    max: 15
  }
};

// Make some sense out of a user supplied connection identifier
// eg 'app1.development' becomes { app: 'app1', env: 'development' }
// eg 'development' becomes { app: 'firstAppDefinedInConfigFile', env: 'development' }
// eg { env: 'production' } becomes { app: 'firstAppDefinedInConfigFile', env: 'production' }
// eg {} or '' become { app: 'firstAppDefinedInConfigFile', env: NODE_ENV or 'development' }
var normalizeConnection = function normalizeConnection(conn) {
  conn = conn || {};
  if (typeof conn === 'string') {
    var parts = conn.split('.');
    conn = {
      env: parts.pop(),
      app: parts.pop()
    };
  }
  // Determine environment to use
  conn.env = conn.env || process.env.NODE_ENV || 'development';
  // Use first app config if none specified
  conn.app = conn.app || Object.keys(connectionConfig)[0];
  return conn;
};

// Load config file (the var stops jslint from complaining)
var loadConfig = exports.loadConfig = function loadConfig(filename) {
  filename = filename || 'config/database.yml';
  if (grunt.file.isFile(filename)) {
    connectionConfig = grunt.file.readYAML(filename);
  } else {
    throw ('Does ' + filename + ' exist, and does it look similar to config/database.yml.sample?');
  }
};

// Return everything we currently know about specified connections
exports.connections = function connections() {
  if (connectionConfig === undefined) {
    loadConfig();
  }
  return connectionConfig;
};

// Return the database name for app/environment (see database.yml.sample)
exports.databaseName = function databaseName(conn) {
  if (connectionConfig === undefined) {
    loadConfig();
  }
  conn = normalizeConnection(conn);
  console.log('conn : ' + util.inspect(conn));
  return connectionConfig[conn.app][conn.env].database;
};

function mergeDefaults(conn) {
  conn = normalizeConnection(conn);
  var conf = connectionConfig[conn.app][conn.env];
  var userDefaults = connectionConfig[conn.app].defaults || {};
  var driver = conf.driver || userDefaults.driver;
  if (!driver) {
    throw 'No database driver specified for : ' + util.inspect(conn);
  }
  // Merge values
  Object.keys(defaults[userDefaults.driver]).forEach(function (key) {
    conf[key] = conf[key] || userDefaults[key] || defaults[userDefaults.driver][key];
  });
  return conf;
}

// Build a connection string from target db + env hash
function connStr(conn) {
  var conf = mergeDefaults(conn);
  var connString = conf.driver + '://' + conf.username + (conf.password ? ':' + conf.password : '') + '@' + conf.host
    + (conf.port ? ':' + conf.port : '') + '/' + conf.database;
  return connString;
}

// Create the connection pool via any-db
function createPool(conn) {
  var conf = connectionConfig[conn.app][conn.env];
  conf.connStr = connStr(conn);
  console.log('Creating pool to : ' + conf.connStr);
  // Create the pool on the conf object for easy future access
  conf.pool = anydb.createPool(conf.connStr, {
    min: conf.min,
    max: conf.max,
    onConnect: function (conn, done) {
      done(null, conn);
    },
    reset: function (conn, done) {
      done(null);
    }
  });
  // Remember all connection pools for easy termination
  pools.push(conf.pool);
  return conf.pool;
}

// Close all connection pools
exports.closeAll = function closeAll() {
  pools.forEach(function (pool) { pool.close(); });
};

// Return pool for specified connection, create if it doesn't exist
exports.pool = function pool(conn) {
  var names, db, env;
  // Load config file if not already done
  if (connectionConfig === undefined) {
    loadConfig();
  }
  conn = normalizeConnection(conn);

  try {
    // If we already created the specified pool return it
    if (connectionConfig[conn.app][conn.env].pool) {
      return connectionConfig[conn.app][conn.env].pool;
    }
  } catch (e) {
    throw 'Database definition ' + util.inspect(conn) + ' doesn\'t seem to exist';
  }
  return createPool(conn);
};
