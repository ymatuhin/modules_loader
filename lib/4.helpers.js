// helpers
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

function pathResolve(url, path = '') {
	// absolute url
	if (url[0] == '/') return url
	return path + url
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
