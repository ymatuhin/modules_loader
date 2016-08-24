module.exports = new Promise(function (res) {
	Modules.load('C.js').then(function (m) {
		res(m)
	})
})
