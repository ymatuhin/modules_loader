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
	const url = pathResolve(urlAliased, path)

	if (modulesPromises[url]) return modulesPromises[url]

	return modulesPromises[url] = new Promise((res, rej) => {
		ajaxGET(config.root + url, (moduleText) => {
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
