export default class AbstractEvent {
	static type = 'event';

	static cancelable = false;

	data = null;

	canceled = false;

	constructor(data = {}) {
		this.data = data;
	}

	get type() {
		return this.constructor.type;
	}

	get cancelable() {
		return this.constructor.cancelable;
	}

	cancel() {
		if (this.cancelable) {
			this.canceled = true;
		}
	}
}
