// AMD stuff
(function (root, factory) {
	var moduleName='XHRPromise';
	if (typeof define === 'function' && define.amd) {
		// AMD. Register
		define(moduleName, ['Promise'], factory);
	} else {
		// Browser globals
		root[moduleName] = factory();
	}
})(this, function (Promise) {

// XHR promise constructor
function XHRPromise(method,url,data,async) {
	if(-1===['HEAD','GET','POST','PUT','DELETE','OPTIONS'].indexOf(method))
		throw Error('Unsupported method.');
	if(!url)
		throw Error('URL missing.');
	data=data||null;
	async=async||true;
	Promise.call(this,function(success,error,progress) {
		var xhr = new XMLHttpRequest();
		xhr.open(method, url, async);
		xhr.onprogress = progress;
		xhr.onload = function(event) {
			if(0!==(''+xhr.status).indexOf('5'))
				success(xhr);
		};
		xhr.onerror = error;
		xhr.send(data);
		var dispose=function() {
			xhr.abort();
			xhr=xhr.onload=xhr.onprogress=xhr.onerror=null;
		};
		return dispose;
	});
}

XHRPromise.prototype=Object.create(Promise.prototype);

return XHRPromise;

});
