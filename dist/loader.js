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
		var url = pathResolve(urlAliased, path);

		if (modulesPromises[url]) return modulesPromises[url];

		return modulesPromises[url] = new Promise(function (res, rej) {
			ajaxGET(config.root + url, function (moduleText) {
				var expModule = evalModule(url, moduleText);

				if (expModule && expModule.toString() === '[object Promise]') {
					checkLongLoadingModules(expModule, url);

					expModule.then(function (moduleExports) {
						return res(moduleExports);
					}, rej);
				} else {
					return res(expModule);
				}
			}, rej);
		});
	}

	function evalModule(url, moduleText) {
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
	function wrapModuleText(moduleText) {
		// to save relative path
		return '\n\t\t(function(window) {\n\t\t\tvar Modules = {\n\t\t\t\tconfig: window.Modules.config,\n\t\t\t\tload: function (mn, dep, path) {\n\t\t\t\t\treturn window.Modules.load(mn, dep, module.path || path)\n\t\t\t\t}\n\t\t\t};\n\n\t\t\t' + moduleText + '\n\n\t\t})(window)\n\t';
	}

	function pathResolve(url) {
		var path = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

		// absolute url
		if (url[0] == '/') return url;
		return path + url;
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