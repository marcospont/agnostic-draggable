import AbstractEvent from '../event/abstract-event';

class SortEvent extends AbstractEvent {
	static type = 'sort';

	get source() {
		return this.data.source || null;
	}

	get helper() {
		return this.data.helper || null;
	}

	get placeholder() {
		return this.data.placeholder || null;
	}

	get sensorEvent() {
		return this.data.sensorEvent || null;
	}

	get originalEvent() {
		return this.data.originalEvent || null;
	}
}

export class SortStartEvent extends SortEvent {
	static type = 'sort:start';

	static cancelable = true;
}

export class SortMoveEvent extends SortEvent {
	static type = 'sort:move';

	static cancelable = true;

	get position() {
		return this.data.position || null;
	}
}

export class SortStopEvent extends SortEvent {
	static type = 'sort:stop';

	static cancelable = true;

	get droppable() {
		return this.data.droppable || null;
	}
}
