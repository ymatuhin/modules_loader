window.Modules = (function() {
	const config = {
		base: '',
		aliases: {},
		maxWait: 15000
	}

	const modulesPromises = {}

	// errors
	const loadingError = (url)    => new Error(`Module ${url} loading too long. Maybe it's circular dependencies?`)
	const parsingError = (url, e) => new Errpr(`Error while parsing module: ${url}, ${e}`)

	init()
	function init() {
		const attr = 'data-main'
		const firstScript = document.querySelector(`script[${attr}]`)
		if (!firstScript) return

		const fileName = firstScript.getAttribute(attr)
		load(fileName)
	}

	function load(mainUrl, arrayOfDep = []) {
		const modulesToLoad = arrayOfDep.map(url => loadModule(url))
		return Promise.all(modulesToLoad)
			.then(() => loadModule(mainUrl))
	}

	function loadModule(url) {
		if (modulesPromises[url]) return modulesPromises[url]

		return modulesPromises[url] = new Promise((res, rej) => {
			ajaxGET(config.base + url, (moduleText) => {
				const expModule = evalModule(url, moduleText)

				if (expModule && expModule.toString() === '[object Promise]') {
					checkLongLoadingModules(expModule, url)

					expModule.then(moduleExports => {
						return res(moduleExports)
					}, rej)
				} else {
					return res(expModule)
				}
			}, rej)
		})
	}

	function evalModule(url, moduleText) {
		try {
			return new Function(moduleText)()
		} catch (e) {
			throw parsingError(url, e)
		}
	}

	function configuration(obj) {
		Object.assign(config, obj)
	}

	// helpers
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

	return { load, config: configuration }
})()
