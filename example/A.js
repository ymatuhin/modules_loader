module.exports = new Promise(function (res) {
	Modules.load('~B.js').then(function (m) {
		res(m)
	})
})
