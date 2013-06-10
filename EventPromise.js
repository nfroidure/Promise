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
})(this, 'XHRPromise', ['./Promise'], function (Promise) {

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
					success(event);
				dispose();
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

	return EventPromise;

});
