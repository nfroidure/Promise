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
})(this, 'WebSocketPromise', ['./Promise'], function (Promise) {

	// WebSocketPromise constructor
	function WebSocketPromise(protocol,hostname,port) {
		protocol=protocol||'ws';
		hostname=hostname||document.location.hostname;
		port=port||80;
		var ws;
		Promise.call(this,function(success,error,progress) {
			// Creating the WebSocket
			var ws = new WebSocket(protocol+'://'+hostname+':'+port);
			var closeSuccess;
			ws.onopen=function() {
				// Giving the ws object and a promise of close
				success({'ws':ws, 'closePromise': new Promise(function(success,error){
					closeSuccess=success;
					closeError=error;
				})});
			};
			ws.onclose=function() {
				closeSuccess&&closeSuccess();				
				dispose();
			};
			ws.onerror=function(e) {
				if(ws.readyState===WebSocket.CONNECTING)
					error(e);
				else
					closeError(e);
				dispose();
			};
			var dispose=function() {
				ws.close();
				ws.onopen=ws.onerror=ws.onclose=null;
			};
			return dispose;
		});
	}

	WebSocketPromise.prototype=Object.create(Promise.prototype);

	WebSocketPromise.getMessagePromise=function(ws,type) {
		return new Promise(function(success,error) {
			var msgHandler=function(event) {
				var msgContent;
				if(event&&event.message) {
					msgContent=JSON.parse(event.message);
					if(msgContent.type&&msgContent.type=type) {
						success(msgContent);
						dispose();
					}
				}
			};
			ws.addEventListener('message', msgHandler);
			var dispose=function() {
				ws.removeEventListener('message', msgHandler);
			};
			return dispose;
		});
	};

	return WebSocketPromise;

});
