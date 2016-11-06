# Module loader

Загрузчик модулей с поддержкой зависимостей.

Добавьте загрузчик через тег script `<script data-main="./index.js" src="./loader.min.js"></script>`, в атрибуте data-main укажите файл который нужно загрузить после того как загрузчик загрузится.

## Примеры

```javascript
// relative path inside module "a"

Modules.load('relative/a.js').then(function (m) {
	document.getElementById('relative').innerHTML = JSON.stringify(m);
});

// with parallel
Modules.load('parallel/a.js', ['parallel/b.js', 'parallel/c.js']).then(function (m) {
	document.getElementById('parallel').innerHTML = JSON.stringify(m);
});

// series
Modules.load('series/a.js').then(function (m) {
	document.getElementById('series').innerHTML = JSON.stringify(m);
});

// css
Modules.load('css/test.css').then(function (m) {
	document.getElementById('css').innerHTML = 'test.css is loaded successfully';
});

// json
Modules.load('json/hello.json').then(function (m) {
	document.getElementById('json').innerHTML = JSON.stringify(m);
});

// text
Modules.load('text/hello.txt').then(function (m) {
	document.getElementById('text').innerHTML = m;
});
```
