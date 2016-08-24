Modules.config({
	aliases: {
		'~': './example/'
	}
})

var el = document.getElementById('rez')

// последовательно
Modules.load('A.js').then(function(m) {
	el.innerHTML = JSON.stringify(m)
})
