// AMD stuff
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register
		define('Promise', [], factory);
	} else {
		// Browser globals
		root.Promise = factory();
	}
})(this, function () {
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
			promise.dispose&&promise.dispose();
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
			thenFail&&thenFail(returnValue.error);
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

	Promise.all=function () {
		var promises=Array.prototype.slice.call(arguments,0),
			solved=0,
			returnValues=new Array(promises.length);
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
						if(solved==promises.length)
							successCallback(returnValues);
					}
				}
			};
			var promiseError=function(promise,index) {
				return function(error) {
					if(solved<promises.length) {
						errorCallback(error);
					solved=promises.length;
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

	Promise.any=function () {
		var promises=Array.prototype.slice.call(arguments,0);
		var errors=0;
		return new Promise(function(successCallback,errorCallback) {
			var promiseDispose=function() {
				promises.forEach(function(p) {
					AWAIT===p.solved&&p.dispose&&p.dispose();
				});
			};
			var promiseSuccess=function(value) {
				promiseDispose();
				successCallback(value);
			};
			var promiseError=function(error) {
				if(++errors===promises.length)
					errorCallback(error);
			};
			promises.forEach(function(promise,index){
				promise.then(promiseSuccess,promiseError);
			});
			return promiseDispose;
		});
	};

	Promise.elapsed=function (time) {
		return new Promise(function(success, error) {
			var timestamp=Date.now();
			var timeout=setTimeout(function() {
				success(Date.now()-timestamp);
			},time);
			return function() { clearTimeout(timeout); };
		});
	};

return Promise;
});
