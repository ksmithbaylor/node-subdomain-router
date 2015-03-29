'use strict';

var net     = require('net');
var http    = require('http');
var exec    = require('child_process').exec;
var assert  = require('assert');
var request = require('request');

var addHostsFileEntries = exports.addHostsFileEntries = function (hosts, done) {
  var command = 'cp -f /etc/hosts /etc/hosts.bak';
  command += hosts.map(function (host) {
    return '&& echo "127.0.0.1 ' + host + '" >> /etc/hosts';
  }).join(' ');

  exec(command, done);
};

var removeHostsFileEntries = exports.removeHostsFileEntries = function (done) {
  exec('mv -f /etc/hosts.bak /etc/hosts', done);
};

var simpleServer = exports.simpleServer = function (text, port, callback) {
  return http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(text + '\n');
  });
};

var errorServer = exports.errorServer = function () {
  var server = net.createServer(function(client) {
    client.destroy();
    server.close();
  });

  return server;
};

var assertResponse = exports.assertResponse = function (url, text, done) {
  request('http://' + url, function (err, res, body) {
    assert.equal(text + '\n', body);
    done();
  });
};

var assertMissingHostResponse = exports.assertMissingHostResponse = function (url, text, done) {
  var options = {
    host: url,
    path: '/',
    method: 'GET',
    port: 80,
    headers: {
      'Host': ''
    }
  };

  var req = http.request(options, function (res) {
    var body = '';
    res.on('data', function (chunk) { body += chunk });
    res.on('end', function () {
      assert.equal(body, text + '\n');
      done();
    })
  });

  req.end();
}

var server1, server2, server3;
var startServers = exports.startServers = function (done) {
  server1 = simpleServer('home page').listen(10000, function() {
    server2 = simpleServer('server a').listen(10001, function () {
      server3 = simpleServer('server d.e.f').listen(10004, done);
    });
  });
};

var stopServers = exports.stopServers = function (done) {
  server1.close(function () {
    server2.close(function () {
      server3.close(done);
    });
  });
};
