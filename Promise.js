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
})(this, 'Promise', [], function () {

	// Promise constructor
	var AWAIT=0, SUCCESS=1, FAIL=-1;
	function Promise(logic) {
		var promise=this;
		promise.solved=AWAIT;
		var success=function (value) {
			if(AWAIT!==promise.solved)
				return;
			promise.solved=SUCCESS;
			promise.value=value;
			if(promise.successCallback)
				promise.successCallback(value);
		};
		var fail=function (error) {
			if(AWAIT!==promise.solved)
				return;
			promise.solved=FAIL;
			promise.error=error;
			if(promise.failCallback)
				promise.failCallback(error);
		};
		var progress=function (value) {
			if(AWAIT!==promise.solved)
				return;
			if(promise.progressCallback)
				promise.progressCallback(error);
		};
		promise.dispose=logic(success, fail, progress);
	}
	
	Promise.prototype.then = function(success, fail, progress) {
		var thenSuccess, thenFail, thenProgress, returnValue, promise=this;
		var thenDispose=function() {
			promise.solved===AWAIT&&promise.dispose&&promise.dispose();
		;}
		var thenPromise=new Promise(function(success,fail,progress) {
			thenSuccess=success;
			thenFail=fail;
			thenProgress=progress;
			return thenDispose;
		});
		var successLogic=function() {
			if(success)
				returnValue=success(promise.value);
			if(returnValue instanceof Promise) {
				returnValue.then(thenSuccess, thenFail, thenProgress);
			} else {
				thenSuccess(returnValue);
			}
		};
		var failLogic=function() {
			if(fail)
				returnValue=fail(promise.error);
			thenFail&&thenFail(returnValue&&returnValue.error?
				returnValue.error:returnValue);
		};
		if(AWAIT===this.solved) {
			this.successCallback=successLogic;
			this.failCallback=failLogic;
			this.progressCallback=progress;
		} else if(SUCCESS===this.solved) {
			setTimeout(successLogic,0);
		} else {
			setTimeout(failLogic,0);
		}
		return thenPromise;
	};

	// Promise compositions
	Promise.some=function(n) {
		if((!n)||(n<0))
			throw Error('n must be superior or equal to 0');
		if(arguments.length<2)
			throw Error('Promise.some wait a least 2 arguments.');
		if(n>arguments.length-1)
			n=arguments.length-1;
		var promises=Array.prototype.slice.call(arguments,1),
			solved=0,
			rejected=0,
			returnValues=new Array(promises.length),
			returnErrors=new Array(promises.length);
		return new Promise(function(successCallback,errorCallback) {
			var promiseDispose=function() {
				promises.forEach(function(p) {
					AWAIT===p.solved&&p.dispose&&p.dispose();
				});
			};
			var promiseSuccess=function(promise,index) {
				return function(value) {
					if(solved<promises.length) {
						returnValues[index]=value;
						solved++;
						if(solved==n)
							successCallback(returnValues);
					}
				}
			};
			var promiseError=function(promise,index) {
				return function(error) {
					rejected++;
					returnErrors[index]=error;
					if(solved+rejected==promises.length) {
						errorCallback(returnErrors);
					}
				}
			};
			promises.forEach(function(promise,index){
				promise.then(promiseSuccess(promise,index),
				promiseError(promise,index));
			});
			return promiseDispose;
		});
	};

	Promise.all=Promise.every=function() {
		if(arguments.length<2)
			throw Error('Promise.all must have at least 2 Promises as arguments.');
		return Promise.some.apply(this,[arguments.length]
			.concat(Array.prototype.slice.call(arguments,0)));
	};

	Promise.any=function() {
		return Promise.some.apply(this,[1]
			.concat(Array.prototype.slice.call(arguments,0)))
			.then(function(results){
				for(var i=0, j=results.length; i<j; i++)
					if(results[i]!==undefined) {
						return Promise.fullfill(results[i]);
					}
			},function(errors){
				return Promise.reject(errors);
			});
	};

	// Promise generators
	Promise.elapsed=function(time) {
		return new Promise(function(success, error) {
			var timestamp=Date.now();
			var timeout=setTimeout(function() {
				success(Date.now()-timestamp);
			},time);
			return function() { clearTimeout(timeout); };
		});
	};

	Promise.dumb=Promise.never=function() {
		return new Promise(function(success, error) {});
	};

	Promise.sure=Promise.fullfill=function(value) {
		return new Promise(function(success, error) { success(value); });
	};

	Promise.reject=function(error) {
		return new Promise(function(success, error) { error(error); });
	};

return Promise;
});
