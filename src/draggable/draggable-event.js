import AbstractEvent from '../event/abstract-event';

export class DraggableEvent extends AbstractEvent {
	static type = 'draggable';

	get draggable() {
		return this.data.draggable || null;
	}
}

export class DraggableInitEvent extends DraggableEvent {
	static type = 'draggable:init';
}

export class DraggableDestroyEvent extends DraggableEvent {
	static type = 'draggable:destroy';
}
