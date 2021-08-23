import AbstractEvent from '../event/abstract-event';

export class DragEvent extends AbstractEvent {
	static type = 'drag';

	get source() {
		return this.data.source || null;
	}

	get helper() {
		return this.data.helper || null;
	}

	get sensorEvent() {
		return this.data.sensorEvent || null;
	}

	get originalEvent() {
		return this.data.originalEvent || null;
	}
}

export class DragStartEvent extends DragEvent {
	static type = 'drag:start';

	static cancelable = true;
}

export class DragMoveEvent extends DragEvent {
	static type = 'drag:move';

	static cancelable = true;

	get position() {
		return this.data.position || null;
	}

	set position(value) {
		this.data.position = value;
	}
}

export class DragStopEvent extends DragEvent {
	static type = 'drag:stop';

	get droppable() {
		return this.data.droppable || null;
	}

	set droppable(value) {
		this.data.droppable = value;
	}
}
