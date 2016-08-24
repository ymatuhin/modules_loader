'use strict';

module.exports = new Promise(function (res) {
	Modules.load('c.js').then(res);
});