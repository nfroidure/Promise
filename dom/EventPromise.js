// AMD + Global: r.js compatible
// Use START + END markers to keep module content only
(function(root,define){ define(['./../Promise'], function(Promise) {
// START: Module logic start

	// Event promise constructor
	function EventPromise(type, element, capture, iterations) {
		if(!type)
			throw Error('Event type is missing.');
		if(!element)
			throw Error('Element to wich attach the event is missing.');
		capture=!!capture;
		iterations=iterations||1;

		Promise.call(this,function(success,error,progress) {
			var eventHandler=function(event) {
				iterations--;
				if(iterations<1) {
					dispose();
					success(event);
				}
			};
			var dispose=function() {
				element.removeEventListener(type, eventHandler, capture);
			};
			element.addEventListener(type, eventHandler, capture);
			return dispose;
		});
	}

	EventPromise.prototype=Object.create(Promise.prototype);

// END: Module logic end

	return EventPromise;

});})(this,typeof define === 'function' && define.amd ? define : function (name, deps, factory) {
	var root=this;
	if(typeof name === 'object') {
		factory=deps; deps=name; name='EventPromise';
	}
	this[name.substring(name.lastIndexOf('/')+1)]=factory.apply(this, deps.map(function(dep){
		return root[dep.substring(dep.lastIndexOf('/')+1)];
	}));
}.bind(this));
