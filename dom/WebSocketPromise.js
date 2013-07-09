// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./../Promise'], function(Promise) {
// START: Module logic start

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
				// Giving the ws object
				success(ws);
			};
			ws.onclose=function() {			
				dispose();
			};
			ws.onerror=function(e) {
				if(ws.readyState===WebSocket.CONNECTING)
					error(e);
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

	WebSocketPromise.getClosePromise=function(ws) {
		return new Promise(function(success,error) {
			var closeHandler=function(event) {
				success(event);
				dispose();
			};
			var errorHandler=function(event) {
				if(ws.readyState!==WebSocket.CONNECTING)
					error(event);
				dispose();
			};
			ws.addEventListener('close', closeHandler);
			ws.addEventListener('error', errorHandler);
			var dispose=function() {
				ws.removeEventListener('close', closeHandler);
				ws.removeEventListener('error', errorHandler);
			};
			return dispose;
		});
	};

	WebSocketPromise.getMessagePromise=function(ws,type) {
		return new Promise(function(success,error) {
			var msgHandler=function(event) {
				var msgContent;
				if(event&&event.data) {
					msgContent=JSON.parse(event.data);
					if(msgContent.type&&msgContent.type==type) {
						dispose();
						success(msgContent);
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

// END: Module logic end

	return WebSocketPromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='WebSocketPromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
