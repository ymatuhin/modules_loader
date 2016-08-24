'use strict';

// relative path inside module "a"

Modules.load('relative/a.js').then(function (m) {
	var relative = document.getElementById('relative');
	relative.innerHTML = JSON.stringify(m);
});

// with parallel
Modules.load('parallel/a.js', ['parallel/b.js', 'parallel/c.js']).then(function (m) {
	var parallel = document.getElementById('parallel');
	parallel.innerHTML = JSON.stringify(m);
});

// series
Modules.load('series/a.js').then(function (m) {
	var series = document.getElementById('series');
	series.innerHTML = JSON.stringify(m);
});