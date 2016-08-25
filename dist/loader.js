'use strict';

window.Modules = function () {

	// variables
	var modulesPromises = {};
	var config = {
		root: '',
		aliases: {},
		maxWait: 15000
	};

	// errors
	var loadingError = function loadingError(url) {
		return new Error('Module ' + url + ' loading too long. Maybe it\'s circular dependencies?');
	};
	var parsingError = function parsingError(url, e) {
		return new Error('Error while parsing module: ' + url + ', ' + e);
	};

	init();

	function init() {
		var attr = 'data-main';
		var firstScript = document.querySelector('script[' + attr + ']');
		if (!firstScript) return;

		var fileName = firstScript.getAttribute(attr);
		load(fileName);
	}

	function load(mainUrl) {
		var dependencies = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
		var path = arguments[2];

		var modulesToLoad = dependencies.map(function (url) {
			return loadModule(url, path);
		});
		return Promise.all(modulesToLoad).then(function () {
			return loadModule(mainUrl, path);
		});
	}

	function loadModule(inputUrl, path) {
		var urlAliased = aliasesResolve(inputUrl, config.aliases);
		var url = pathResolve(urlAliased, path, config.root);
		var extension = getFileExtension(url);

		if (modulesPromises[url]) return modulesPromises[url];

		return modulesPromises[url] = new Promise(function (resolve, reject) {
			if (extension === 'js') return loadJS(url, resolve, reject);
			if (extension === 'css') return loadCSS(url, resolve, reject);
			if (extension === 'json') return loadJSON(url, resolve, reject);
			return loadText(url, resolve, reject);
		});
	}

	function loadText(url, resolve, reject) {
		ajaxGET(url, function (moduleText) {
			resolve(moduleText);
		}, reject);
	}

	function loadJSON(url, resolve, reject) {
		ajaxGET(url, function (moduleText) {
			try {
				resolve(JSON.parse(moduleText));
			} catch (e) {
				reject(e);
			}
		}, reject);
	}

	function loadCSS(url, resolve, reject) {
		loadStyleSheet(url, function (success) {
			if (success) return resolve();
			return reject();
		});
	}

	function loadJS(url, resolve, reject) {
		ajaxGET(url, function (moduleText) {
			var expModule = evalJS(url, moduleText);

			if (expModule && expModule.toString() === '[object Promise]') {
				checkLongLoadingModules(expModule, url);

				expModule.then(function (moduleExports) {
					return resolve(moduleExports);
				}, reject);
			} else {
				return resolve(expModule);
			}
		}, reject);
	}

	function evalJS(url, moduleText) {
		try {
			var module = { path: url.slice(0, url.lastIndexOf('/') + 1) };
			var wrappedModuleText = wrapModuleText(moduleText);
			new Function('module', wrappedModuleText)(module);
			return module.exports;
		} catch (e) {
			throw parsingError(url, e);
		}
	}

	function configuration(obj) {
		Object.keys(obj).forEach(function (keyString) {
			config[keyString] = obj[keyString];
		});
	}

	// helpers
	function loadStyleSheet(path, fn, scope) {
		var head = document.getElementsByTagName('head')[0],
		    // reference to document.head for appending/ removing link nodes
		link = document.createElement('link'); // create the link node
		link.setAttribute('href', path);
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('type', 'text/css');

		var sheet, cssRules;
		// get the correct properties to check for depending on the browser
		if ('sheet' in link) {
			sheet = 'sheet';
			cssRules = 'cssRules';
		} else {
			sheet = 'styleSheet';
			cssRules = 'rules';
		}

		var interval_id = setInterval(function () {
			// start checking whether the style sheet has successfully loaded
			try {
				if (link[sheet] && link[sheet][cssRules].length) {
					// SUCCESS! our style sheet has loaded
					clearInterval(interval_id); // clear the counters
					clearTimeout(timeout_id);
					fn.call(scope || window, true, link); // fire the callback with success == true
				}
			} catch (e) {} finally {}
		}, 10),
		    // how often to check if the stylesheet is loaded
		timeout_id = setTimeout(function () {
			// start counting down till fail
			clearInterval(interval_id); // clear the counters
			clearTimeout(timeout_id);
			head.removeChild(link); // since the style sheet didn't load, remove the link node from the DOM
			fn.call(scope || window, false, link); // fire the callback with success == false
		}, 15000); // how long to wait before failing

		head.appendChild(link); // insert the link node into the DOM and start loading the style sheet

		return link; // return the link node;
	}

	function getFileExtension(url) {
		var splittedURL = url.split('.');
		return splittedURL[splittedURL.length - 1].toLowerCase();
	}

	function wrapModuleText(moduleText) {
		// to save relative path
		return '\n\t\t(function(window) {\n\t\t\tvar Modules = {\n\t\t\t\tconfig: window.Modules.config,\n\t\t\t\tload: function (mn, dep, path) {\n\t\t\t\t\treturn window.Modules.load(mn, dep, module.path || path)\n\t\t\t\t}\n\t\t\t};\n\n\t\t\t' + moduleText + '\n\n\t\t})(window)\n\t';
	}

	function pathResolve(url) {
		var path = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
		var root = arguments[2];

		// absolute url
		if (url[0] == '/') return url;
		return root + path + url;
	}

	function aliasesResolve(url, aliases) {
		var stop = false;
		var newUrl = url;
		Object.keys(aliases).forEach(function (aliasString) {
			if (stop) return;
			if (newUrl.indexOf(aliasString) === -1) return;

			newUrl = newUrl.replace(aliasString, aliases[aliasString]);
		});

		return newUrl;
	}

	function ajaxGET(url, success, error) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);

		request.onload = function () {
			if (request.status >= 200 && request.status < 400) success(request.responseText);else error(request);
		};

		request.onerror = error;
		request.send();
	}

	function getPromiseState(p) {
		return Promise.race([Promise.all([p, Promise.resolve()]).then(function () {
			return "fulfilled";
		}, function () {
			return "rejected";
		}), Promise.resolve().then(0).then(function () {
			return "pending";
		})]);
	}

	function checkLongLoadingModules(module, url) {
		setTimeout(function () {
			getPromiseState(module).then(function (status) {
				if (status != 'pending') return;
				throw loadingError(url);
			});
		}, config.maxWait);
	}

	return {
		load: load,
		config: configuration
	};
}();