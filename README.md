dprox – declarative reverse proxy for local development
=======================================================

a simple wrapper around
[express-http-proxy](https://github.com/villadora/express-http-proxy)


Getting Started
---------------

ensure [Node](http://nodejs.org) is available, then install dprox:

```
$ npm install dprox
```

create a `proxy.config.js`:

```javascript
module.exports = {
    self: "localhost:8080",
    "/foo": {
        uri: "localhost:8081",
        preserveHost: true,
        preservePrefix: true
    },
    "/bar": {
        uri: "localhost:8082",
        preserveHost: true
    },
    "/assets": "localhost:3000"
};
```

`dprox` starts the proxy, reading configuration from `proxy.config.js` within
the current working directory

`dprox -c /path/to/any.js` reads a custom configuration file instead

(note that this assumes the `dprox` executable resides on your `PATH`, otherwise
you might have to provide the full path to that file)


Configuration
-------------

`proxy.config.js` is expected to export an object mapping paths to applications

an optional `self` entry defines the proxy's own address (which defaults to
`"localhost:3333"`)

each entry is either a URI string or an object with the following options:

* `uri` is the address to pass requests to
* `preserveHost`, if truthy, passes the HTTP `Host` header through to the
  respective application
* `preservePrefix`, if truthy, passes the configuration's URI prefix through to
  the respective application
* `log`, if truthy, activates logging for the respective entry
    * if the value is a function, it will be invoked with the respective HTTP
      request object (e.g. `log: req => { console.log(req.method +  req.url) }`)
    * otherwise, unless `true`, the value will be prepended to the default log
      message (e.g. `log: "[PROXY]"`)


Contributing
------------

* `npm install` downloads dependencies
* `npm test` checks code for stylistic consistency
