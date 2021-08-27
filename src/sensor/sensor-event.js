import AbstractEvent from '../event/abstract-event';

export default class SensorEvent extends AbstractEvent {
	get pageX() {
		return this.data.pageX || null;
	}

	get pageY() {
		return this.data.pageY || null;
	}

	get target() {
		return this.data.target || null;
	}

	set target(value) {
		this.data.target = value;
	}

	get caller() {
		return this.data.caller || null;
	}

	get originalEvent() {
		return this.data.originalEvent || null;
	}

	preventDefault() {
		this.originalEvent?.preventDefault();
	}

	stopPropagation() {
		this.originalEvent?.stopPropagation();
	}
}
