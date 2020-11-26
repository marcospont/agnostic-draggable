import AbstractEvent from '../event/abstract-event';

export class DroppableEvent extends AbstractEvent {
	static type = 'droppable';

	get droppable() {
		return this.data.droppable || null;
	}
}

export class DroppableInitEvent extends DroppableEvent {
	static type = 'droppable:init';
}

export class DroppableActivateEvent extends DroppableEvent {
	static type = 'droppable:activate';

	get sensorEvent() {
		return this.data.sensorEvent || null;
	}

	get draggable() {
		return this.data.draggable || null;
	}
}

export class DroppableOverEvent extends DroppableActivateEvent {
	static type = 'droppable:over';
}

export class DroppableDropEvent extends DroppableActivateEvent {
	static type = 'droppable:drop';
}

export class DroppableOutEvent extends DroppableActivateEvent {
	static type = 'droppable:out';
}

export class DroppableDeactivateEvent extends DroppableActivateEvent {
	static type = 'droppable:deactivate';
}

export class DroppableDestroyEvent extends DroppableEvent {
	static type = 'droppable:destroy';
}
