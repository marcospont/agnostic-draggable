export default class Sensor {
	caller = null;
	active = false;
	lastEvent = null;

	constructor(caller) {
		this.caller = caller;
	}

	attach() {}

	detach() {}

	cancel(sensorEvent) {}

	trigger(sensorEvent) {
		const event = document.createEvent('Event');

		event.detail = sensorEvent;
		event.initEvent(sensorEvent.type, true, true);
		document.dispatchEvent(event);
		this.lastEvent = event;
	}
}
