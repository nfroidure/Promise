// AMD stuff
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register
		define('EventPromise', ['Promise'], factory);
	} else {
		// Browser globals
		root.EventPromise = factory(root.Promise);
	}
})(this, function (Promise) {


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
