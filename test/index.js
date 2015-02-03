'use strict';

var proxy    = require('..');
var testUtil = require('./testUtil');

var hostBase = 'subdomain-router-test.com';

// These hosts are added to the hosts file temporarily
var hosts = [
  hostBase,
  '.'      + hostBase,
  'a.'     + hostBase,
  'b.'     + hostBase,
  'c.'     + hostBase,
  'd.'     + hostBase,
  'd.e.f.' + hostBase
];

// Used to start and stop the proxy server
var proxyServer;

describe('subdomain-router', function () {
  before(function (done) {
    testUtil.addHostsFileEntries(hosts, function () {
      testUtil.startServers(done);
    });
  });

  after(function (done) {
    testUtil.removeHostsFileEntries(function () {
      testUtil.stopServers(done);
    });
  });

  describe('basic config', function() {
    before(function (done) {
      proxyServer = proxy({
        host: hostBase,
        subdomains: {
          '':      10000,
          'a':     10001,
          'b':     10002,
          // c purposefully not defined
          'd':     10005,
          'd.e.f': 10004
        }
      });

      proxyServer.listen(80, done);
    });

    after(function (done) {
      proxyServer.close(done);
    });

    it('should get home page', function (done) {
      testUtil.assertResponse(hostBase, 'home page', done);
    });

    it('should get subdomain a', function (done) {
      testUtil.assertResponse('a.' + hostBase, 'server a', done);
    });

    it('should respond when server b is down', function (done) {
      var downText = 'There is usually something here, but it is down right now.';
      testUtil.assertResponse('b.' + hostBase, downText, done);
    });

    it('should respond when the proxy does not know about server c', function (done) {
      var invalidText = 'There is nothing running here.';
      testUtil.assertResponse('c.' + hostBase, invalidText, done);
    });

    it('should respond with an error message on a weird error', function (done) {
      var errorText = 'Server error.';
      testUtil.errorServer().listen(10005, function () {
        testUtil.assertResponse('d.' + hostBase, errorText, done);
      });
    })

    it('should respond for multiple subdomains', function (done) {
      testUtil.assertResponse('d.e.f.' + hostBase, 'server d.e.f', done);
    });
  });

  describe('no subdomain config', function () {
    before(function (done) {
      proxyServer = proxy({
        host: hostBase,
      });

      proxyServer.listen(80, done);
    });

    after(function (done) {
      proxyServer.close(done);
    });

    it('should return default home page text', function (done) {
      var homeText = 'This is the home page.';
      testUtil.assertResponse(hostBase, homeText, done);
    });
  });

  describe('custom messages config', function () {
    before(function (done) {
      proxyServer = proxy({
        host: hostBase,
        messages: {
          home:    'custom home message',
          down:    'custom down message',
          invalid: 'custom invalid message',
          error:   'custom error message'
        },
        subdomains: {
          'b': 10002,
          'd': 10005
        }
      });

      proxyServer.listen(80, done);
    });

    after(function (done) {
      proxyServer.close(done);
    });

    it('should return a custom home message', function (done) {
      testUtil.assertResponse(hostBase, 'custom home message', done);
    });

    it('should return a custom down message', function (done) {
      testUtil.assertResponse('b.' + hostBase, 'custom down message', done);
    });

    it('should return a custom invalid message', function (done) {
      testUtil.assertResponse('c.' + hostBase, 'custom invalid message', done);
    });

    it('should return a custom error message', function (done) {
      testUtil.errorServer().listen(10005, function () {
        testUtil.assertResponse('d.' + hostBase, 'custom error message', done);
      });
    });
  });
});
