// AMD + global + node : You can use this object by inserting a script
// or using an AMD loader (like RequireJS) or using NodeJS require function
(function(root,define){ define([], function() {
// START: Module logic start

	// Constants
	var AWAIT=0, SUCCESS=1, FAIL=-1, DISPOSED=2;

	// Promise constructor
	function Promise(logic) {
		var promise=this;
		// Initialise the state
		promise.solved=AWAIT;
		// Prepare callbacks registration
		promise.successCallbacks=[];
		promise.failCallbacks=[];
		promise.progressCallbacks=[];
		// called by the resover if the promise fullfills
		var success=function (value) {
			if(AWAIT!==promise.solved)
				return;
			promise.solved=SUCCESS;
			promise.value=value;
			while(promise.successCallbacks.length&&!(promise.solved&DISPOSED))
				promise.successCallbacks.shift()(value);
			// empty other callbacks
			promise.failCallbacks=[];
			promise.progressCallbacks=[];
		};
		// called by the resover if the promise fails
		var fail=function (error) {
			if(DISPOSED===promise.solved)
				return;
			promise.solved=FAIL;
			promise.error=error;
			while(promise.failCallbacks.length&&!(promise.solved&DISPOSED))
				promise.failCallbacks.shift()(error);
			// empty other callbacks
			promise.successCallbacks=[];
			promise.progressCallbacks=[];
		};
		// called by the resover when the fullfill progress
		var progress=function (value) {
			if(DISPOSED===promise.solved)
				return;
			for(var i=0, j=promise.progressCallbacks.length; i<j; i++)
				promise.progressCallbacks[i](value);
		};
		// Executins the promise logic
		var dispose=logic(success, fail, progress);
		// Creating the dispose method
		promise.dispose=function() {
			if(promise.solved===AWAIT) {
				dispose&&dispose();
				promise.successCallbacks=[];
				promise.failCallbacks=[];
				promise.progressCallbacks=[];
				promise.error=promise.value=null;
				promise.solved=DISPOSED;
			}
		}
	}
	
	Promise.prototype.then = function(success, fail, progress) {
		var thenSuccess, thenFail, thenProgress, returnValue, promise=this;
		var thenDispose=function() {
			promise.dispose();
		;}
		var thenPromise=new Promise(function(success,fail,progress) {
			thenSuccess=success;
			thenFail=fail;
			thenProgress=progress;
			return thenDispose;
		});
		var successLogic=function() {
			if(AWAIT!==thenPromise.solved)
				return;
			if(success)
				returnValue=success(promise.value);
			if(returnValue instanceof Promise) {
				returnValue.then(thenSuccess, thenFail, thenProgress);
			} else {
				thenSuccess(returnValue);
			}
		};
		var failLogic=function() {
			if(AWAIT!==thenPromise.solved)
				return;
			if(fail)
				returnValue=fail(promise.error);
			thenFail&&thenFail(returnValue&&returnValue.error?
				returnValue.error:returnValue);
		};
		if(AWAIT===this.solved) {
			this.successCallbacks.push(successLogic);
			this.failCallbacks.push(failLogic);
			progress&&this.progressCallbacks.push(progress);
		} else if(SUCCESS===this.solved) {
			setTimeout(successLogic,0);
		} else if(FAIL===this.solved) {
			setTimeout(failLogic,0);
		}
		return thenPromise;
	};

	// Promise compositions

	// Creates a promise fullfilled when 'n' of the promises given are
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
					AWAIT===p.solved&&p.dispose();
				});
			};
			var promiseSuccess=function(promise,index) {
				return function(value) {
					if(solved<promises.length) {
						returnValues[index]=value;
						solved++;
						if(solved==n){
							promiseDispose();
							successCallback(returnValues);
						}
					}
				}
			};
			var promiseError=function(promise,index) {
				return function(error) {
					rejected++;
					returnErrors[index]=error;
					if(solved+rejected==promises.length) {
						promiseDispose();
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

	// Creates a promise fullfilled when each promises given are
	Promise.all=Promise.every=function() {
		if(arguments.length<2)
			throw Error('Promise.all must have at least 2 Promises as arguments.');
		return Promise.some.apply(this,[arguments.length]
			.concat(Array.prototype.slice.call(arguments,0)));
	};


	// Creates a promise fullfilled when one of the given promises is
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

	// Chain promises to resolve sequentially
	Promise.seq=function(){
		if(arguments.length<2)
			throw Error('Promise.seq must have at least 2 Promises as arguments.');
		var lastPromise=arguments[0];
		for(var i=1, j=arguments.length; i<j; i++) {
			lastPromise.then(function() {
				return arguments[i];
			});
			lastPromise=arguments;
		}
		return arguments[0];
	}

	// Promise generators

	// Creates a promise fullfilled after 'time' seconds
	Promise.elapsed=function(time) {
		return new Promise(function(success, error) {
			var timestamp=Date.now();
			var timeout=setTimeout(function() {
				success(Date.now()-timestamp);
			},time);
			return function() { clearTimeout(timeout); };
		});
	};

	// Creates a never fullfilled promise
	Promise.dumb=Promise.never=function() {
		return new Promise(function(success, error) {});
	};

	// Creates a systematically fullfilled promise
	Promise.sure=Promise.fullfill=function(value, async) {
		return new Promise(function(success, error) {
			if(async) {
				setTimeout(function(){
					success(value);
				},0)
			} else {
				success(value);
			}
		});
	};

	// Creates a systematically rejected promise
	Promise.reject=function(error, async) {
		return new Promise(function(success, error) {
			if(async) {
				setTimeout(function(){
					error(error);
				},0)
			} else {
				error(error);
			}
		});
	};

// END: Module logic end

return Promise;

});})(this,typeof define === 'function' && define.amd ?
	// AMD
	define :
	// NodeJS
	(typeof exports === 'object'?function (name, deps, factory) {
		var root=this;
		if(typeof name === 'object') {
			factory=deps; deps=name;
		}
		module.exports=factory.apply(this, deps.map(function(dep){
			return require(dep);
		}));
	}:
	// Global
	function (name, deps, factory) {
		var root=this;
		if(typeof name === 'object') {
			factory=deps; deps=name;
		}
		this.Promise=factory.apply(this, deps.map(function(dep){
			return root[dep.substring(dep.lastIndexOf('/')+1)];
		}));
	}.bind(this)
	)
);
