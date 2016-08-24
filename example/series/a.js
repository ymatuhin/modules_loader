module.exports = new Promise(function (res) {
	Modules.load('b.js').then(res)
})
