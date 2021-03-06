#!/usr/bin/env node
let proxy = require("express-http-proxy");
let express = require("express");
let path = require("path");

let CONFIG = "proxy.config.js";
let HOST = "localhost:3333";

main(process.argv.slice(2), process.cwd());

function main(args, referenceDir) {
	let config = CONFIG;
	if(args.length) { // simplistic options parsing
		let option = args[0];
		if(option !== "-c" && option !== "--config") {
			abort(`unsupported option: \`${option}\``);
		}
		config = args[1];
	}
	config = path.resolve(referenceDir, config);

	let hosts = loadConfig(config);

	let { self } = hosts;
	if(self.substr) {
		self = { uri: self };
	}
	let [host, port] = self.uri.split(":"); // XXX: brittle
	delete hosts.self;

	let { limit } = self;
	let options = limit ? { limit } : {};
	makeProxy(host, parseInt(port, 10), hosts, options);
}

function makeProxy(host, port, hosts, defaults) {
	let app = express();

	Object.keys(hosts).forEach(route => {
		let options = Object.assign({}, defaults);
		let host = hosts[route];

		if(host.call) { // `host` is an Express middleware function
			app.use(route, host);
			return;
		}

		let { uri } = host;
		if(uri === undefined) { // `host` is the URI
			app.use(route, proxy(host, options));
			return;
		}

		let { requestHeaders, responseHeaders, log } = host;
		if(host.preserveHost) {
			options.preserveHostHdr = true;
		}
		if(host.preservePrefix) {
			options.proxyReqPathResolver = req => req.originalUrl;
		}
		options.proxyReqOptDecorator = proxyReqOptions => {
			if(host.insecure) {
				proxyReqOptions.rejectUnauthorized = false;
			}
			if(requestHeaders) {
				Object.assign(proxyReqOptions.headers, requestHeaders);
			}
			return proxyReqOptions;
		};

		if(responseHeaders) {
			options.userResHeaderDecorator = headers => Object.assign({},
					headers, responseHeaders);
		}

		if(log) {
			if(!log.call) {
				let prefix = log === true ? "" : `${log} `;
				log = req => { // eslint-disable-next-line no-console
					console.log(`${prefix}${req.method} ${req.url}`);
				};
			}
			options.filter = req => { // XXX: hacky
				log(req);
				return true;
			};
		}

		app.use(route, proxy(uri, options));
	});

	let server = app.listen(port, host, _ => {
		let { address, port } = server.address();
		console.log(`→ http://${address}:${port}`); // eslint-disable-line no-console
	});
	return server;
}

function loadConfig(filepath, host = HOST) {
	try {
		var config = require(filepath); // eslint-disable-line no-var
	} catch(err) {
		if(err.code === "MODULE_NOT_FOUND") {
			abort(`missing configuration file: ${config}`);
		}
		throw err;
	}
	return Object.assign({ self: host }, config);
}

function abort(message, code = 1) {
	console.error(message);
	process.exit(code);
}
