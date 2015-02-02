# subdomain-router

A tool for routing HTTP traffic to and from predefined ports based on the subdomain of the request. This is sometimes known as a "reverse proxy".

### Installation

```sh
$ npm install subdomain-router
```

### Usage

`require`ing the module returns a function that takes in a configuration object and returns an HTTP server.  This server accepts requests and, based on the subdomain of each request, routes traffic to different ports on the same machine. This allows for multiple apps and services to be run on a single host and accessed in a convenient way, similar in spirit to Heroku.

A simple example:

```javascript
// reverseProxy.js

var proxy = require('subdomain-router');
var http = require('http');

var simpleServer = function (text) {
  return http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(text + '\n');
  });
};

simpleServer('this is from the home page').listen(10000);
simpleServer('this is from abc').listen(10001);
simpleServer('this is from def').listen(10002);

var proxyServer = proxy({
  host: 'example.com',
  subdomains: {
    '':  10000, // This is for the home page
    abc: 10001,
    def: 10002,
    ghi: 10003  // This server is "down" since we didn't start anything up on port 10003
  }
});

proxyServer.listen(80); // Requires sudo access, could be any other port
```

This example starts up three simple servers that just return some static text for every request for the sake of illustration, but in a real use-case there might be other apps and services running on those ports instead.

Assuming the following entries appear in your `/etc/hosts` file (or the network's DNS configuration directs the traffic for `example.com` and all subdomains to your computer (unfortunately you have to define each subdomain you want in your hosts file, unlike DNS):

```
127.0.0.1 example.com
127.0.0.1 www.example.com
127.0.0.1 abc.example.com
127.0.0.1 def.example.com
127.0.0.1 ghi.example.com
127.0.0.1 asdf.example.com
```

You can start up your servers with:

```sh
$ sudo node reverseProxy.js   # sudo is needed for port 80
```

And in a separate terminal window (or web browser):

```sh
$ curl example.com
this is from the home page

$ curl abc.example.com
this is from abc

$ curl def.example.com
this is from def

$ curl ghi.example.com   # This subdomain is known but not running, returns default response
There is usually something here, but it is down right now.

$ curl asdf.example.com   # This subdomain is not known, returns default response
There is nothing running here.
```

Requests to the host without a subdomain get directed to the port mapped to `''` in the `subdomains` object of the config. It's usually a good idea to map both `''` and `www` to the port your main website is running on.

Optionally, you can define custom messages to serve (as plain text) as follows:

```javascript
var proxyServer = proxy({
  host: 'example.com',
  messages: {
    home: 'This is my fancy home page',
    invalid: 'I don\'t know about this subdomain',
    down: 'This app or service is down right now',
    error: 'There was a weird connection error'
  },
  subdomains: {
    ghi: 10003
  }
});
```

```sh
$ curl example.com
This is my fancy home page

$ curl asdf.example.com
I don't know about this subdomain

$ curl ghi.example.com
This app or service is down right now
```

The only field in the config object that is strictly required is the `host` field. A proxy started with this field alone will just serve the default text (`'This is the home page.'`) for all requests to `example.com`.

Please submit any suggestions, comments, and bugs to the issue tracker on Github.
