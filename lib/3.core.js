init()

function init() {
	const attr = 'data-main'
	const firstScript = document.querySelector(`script[${attr}]`)
	if (!firstScript) return

	const fileName = firstScript.getAttribute(attr)
	load(fileName)
}

function load(mainUrl, dependencies = [], path) {
	const modulesToLoad = dependencies.map(url => loadModule(url, path))
	return Promise.all(modulesToLoad).then(() => loadModule(mainUrl, path))
}

function loadModule(inputUrl, path) {
	const urlAliased = aliasesResolve(inputUrl, config.aliases)
	const url = pathResolve(urlAliased, path, config.root)
	const extension = getFileExtension(url)

	if (modulesPromises[url]) return modulesPromises[url]

	return modulesPromises[url] = new Promise((resolve, reject) => {
		if (extension === 'js') return loadJS(url, resolve, reject)
		if (extension === 'css') return loadCSS(url, resolve, reject)
		if (extension === 'json') return loadJSON(url, resolve, reject)
		return loadText(url, resolve, reject)
	})
}

function loadText(url, resolve, reject) {
	ajaxGET(url, (moduleText) => {
		resolve(moduleText)
	}, reject)
}

function loadJSON(url, resolve, reject) {
	ajaxGET(url, (moduleText) => {
		try {
			resolve(JSON.parse(moduleText))
		} catch (e) {
			reject(e)
		}
	}, reject)
}

function loadCSS(url, resolve, reject) {
	loadStyleSheet(url, (success) => {
		if (success) return resolve()
		return reject()
	})
}

function loadJS(url, resolve, reject) {
	ajaxGET(url, (moduleText) => {
		const expModule = evalJS(url, moduleText)

		if (expModule && expModule.toString() === '[object Promise]') {
			checkLongLoadingModules(expModule, url)

			expModule.then(moduleExports => {
				return resolve(moduleExports)
			}, reject)
		} else {
			return resolve(expModule)
		}
	}, reject)
}

function evalJS(url, moduleText) {
	try {
		const module = { path: url.slice(0, url.lastIndexOf('/') + 1) }
		const wrappedModuleText = wrapModuleText(moduleText)
		new Function('module', wrappedModuleText)(module)
		return module.exports
	} catch (e) {
		throw parsingError(url, e)
	}
}

function configuration(obj) {
	Object.keys(obj).forEach(keyString => {
		config[keyString] = obj[keyString]
	})
}
