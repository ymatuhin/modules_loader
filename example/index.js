var el = document.getElementById('rez')

// последовательно
Modules.load('A.js', ['B.js', 'C.js']).then(function(m) {
	el.innerHTML = JSON.stringify(m)
})
