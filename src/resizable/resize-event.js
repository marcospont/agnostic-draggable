import AbstractEvent from '../event/abstract-event';

class ResizeEvent extends AbstractEvent {
	get element() {
		return this.data.element || null;
	}

	get helper() {
		return this.data.helper || null;
	}

	get originalElement() {
		return this.data.originalElement || null;
	}

	get originalSize() {
		return this.data.originalSize || null;
	}

	get originalPosition() {
		return this.data.originalPosition || null;
	}

	get size() {
		return this.data.size || null;
	}

	get position() {
		return this.data.position || null;
	}

	get sensorEvent() {
		return this.data.sensorEvent || null;
	}

	get originalEvent() {
		return this.data.originalEvent || null;
	}
}

export class ResizeStartEvent extends ResizeEvent {
	static type = 'resize:start';

	static cancelable = true;
}

export class ResizeChangeEvent extends ResizeEvent {
	static type = 'resize:change';

	static cancelable = true;
}

export class ResizeStopEvent extends ResizeEvent {
	static type = 'resize:stop';

	static cancelable = true;
}
