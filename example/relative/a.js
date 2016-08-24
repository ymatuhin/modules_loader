module.exports = new Promise(function (res) {
	Modules.load('folder_b/b.js').then(res)
})
