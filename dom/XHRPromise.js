// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./../Promise'], function(Promise) {
// START: Module logic start

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

// END: Module logic end

	return XHRPromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='XHRPromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
