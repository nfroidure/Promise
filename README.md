Promise
==============

A minimalist Promise implementation.

How to use Promise
--------------

You can add script tags to your HTML or use RequireJS. To create a promise:

```js
// synchronous
var p=new Promise(function(success,error) {
	var successful=false;
	// your logic here
	if(successfull)
		success();
	else
		error();
});

// asynchronous
var p=new Promise(function(success,error) {
	setTimeout(success,1000);
	var dispose=function() {
		// avoid memory leaks :
		// remove event listeners / DOM Elements ...
	}
	return dispose;
});
```

Simple example with event promises:
```js
// Simple event promise
new EventPromise('click',document).then(function () {
	console.log('Clicked');
	});
 
// Sequential promises
getEventPromise('keydown',document).then(function () {
	return getEventPromise('click',document,false,2);
}).then(function () {
	return getEventPromise('mousemove',document);
}).then(function () {
	console.log('Keydown + click twice + mousemove sequentially')
});
 
// Promise that all promises will be completed
Promise.all(
	new EventPromise('click',document),
	new EventPromise('keyup',document),
	new EventPromise('mousemove',document)
).then(function() {
	console.log('Keyup + click + mousemove')
});
 
// Promise that one of the promises will be completed
Promise.any(
	getEventPromise('click',document),
	getEventPromise('keyup',document),
	getEventPromise('mousemove',document)
).then(function() {
	console.log('Keyup | click | mousemove')
});
 
// Helper to create a timeout promise
Promise.elapsed(1000).then(function(d) {
	console.log(d+'ms elapsed.')
});

// Other composition samples

// loading a list of resources before a given timeout
Promise.any(
	// adding the timeout
	Promise.elapsed(1000),
	// setting the resource list
	Promise.all(
		new XHRPromise('GET','/path.json'),
		new XHRPromise('GET','/path2.json'),
		new XHRPromise('GET','/path3.json')
	)
).then(function(value) {
	if('number' === typeof value)
		console.log('timeout !');
	else
		console.log(value);
	});

// Promise that at least 2 promises will be succefully fullfilled
Promise.some(2,
		new XHRPromise('GET','/path.json'),
		new XHRPromise('GET','/path2.json'),
		new XHRPromise('GET','/path3.json')
	);

// Return a sequential resolution chain of the promises given as arguments
// /!\ will not execute promises sequentially
Promise.seq(2,
		new XHRPromise('GET','/path.json'),
		new XHRPromise('GET','/path2.json'),
		new XHRPromise('GET','/path3.json')
	);

// to do
// Promise that all promises will be completed (include errors): Promise.full
// Promise that one of the promises will be completed (include errors): Promise.?

```

Sample
--------------
You can find [a proof of concept](http://codepen.io/seraphzz/pen/oHdJD) on Codepen.io,
	[Liar](https://github.com/nfroidure/Liar) is a game based on this lib you can look at.
