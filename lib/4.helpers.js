// helpers
function loadStyleSheet(path, fn, scope) {
	var head = document.getElementsByTagName('head')[0], // reference to document.head for appending/ removing link nodes
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

	var interval_id = setInterval(function() { // start checking whether the style sheet has successfully loaded
			try {
				if (link[sheet] && link[sheet][cssRules].length) { // SUCCESS! our style sheet has loaded
					clearInterval(interval_id); // clear the counters
					clearTimeout(timeout_id);
					fn.call(scope || window, true, link); // fire the callback with success == true
				}
			} catch (e) {} finally {}
		}, 10), // how often to check if the stylesheet is loaded
		timeout_id = setTimeout(function() { // start counting down till fail
			clearInterval(interval_id); // clear the counters
			clearTimeout(timeout_id);
			head.removeChild(link); // since the style sheet didn't load, remove the link node from the DOM
			fn.call(scope || window, false, link); // fire the callback with success == false
		}, 15000); // how long to wait before failing

	head.appendChild(link); // insert the link node into the DOM and start loading the style sheet

	return link; // return the link node;
}

function getFileExtension(url) {
	const splittedURL = url.split('.')
	return splittedURL[splittedURL.length - 1].toLowerCase()
}

function wrapModuleText(moduleText) {
	// to save relative path
	return `
		(function(window) {
			var Modules = {
				config: window.Modules.config,
				load: function (mn, dep, path) {
					return window.Modules.load(mn, dep, module.path || path)
				}
			};

			${moduleText}

		})(window)
	`
}

function pathResolve(url, path = '', root) {
	// absolute url
	if (url[0] == '/') return url
	return root + path + url
}

function aliasesResolve(url, aliases) {
	let stop = false
	let newUrl = url
	Object.keys(aliases).forEach(aliasString => {
		if (stop) return
		if (newUrl.indexOf(aliasString) === -1) return

		newUrl = newUrl.replace(aliasString, aliases[aliasString])
	})

	return newUrl
}

function ajaxGET(url, success, error) {
	var request = new XMLHttpRequest()
	request.open('GET', url, true)

	request.onload = function() {
		if (request.status >= 200 && request.status < 400) success(request.responseText)
		else error(request)
	}

	request.onerror = error
	request.send()
}

function getPromiseState(p) {
	return Promise.race([
		Promise.all([p, Promise.resolve()]).then(() => "fulfilled", () => "rejected"),
		Promise.resolve().then(0).then(() => "pending")
	])
}

function checkLongLoadingModules(module, url) {
	setTimeout(() => {
		getPromiseState(module).then(status => {
			if (status != 'pending') return
			throw loadingError(url)
		})
	}, config.maxWait)
}
