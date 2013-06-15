// UMD stuff : Browser + RequireJS + Node
(function (root, moduleName, deps, factory) {
	if (typeof exports === 'object') {
	// Node. Does not work with strict CommonJS, but
	// only CommonJS-like enviroments that support module.exports,
	// like Node.
	module.exports = factory.apply(root,deps.map(function(dep) {
		return require(dep);
	}));
	} else if (typeof define === 'function' && define.amd) {
		// AMD. Register as a 'moduleName' named module.
		define(deps, factory);
	} else {
		// Browser globals
		root[moduleName] = factory.apply(root,deps.map(function(dep) {
			return root[dep];
		}));
	}
})(this, 'XHRPromise', ['./../Promise'], function (Promise) {

	// XHRPromise constructor
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
				xhr.onload=xhr.onprogress=xhr.onerror=null;
				if(0!==(''+xhr.status).indexOf('5'))
					success(xhr);
				else
					error(xhr);
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
