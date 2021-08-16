import AbstractEvent from '../event/abstract-event';

class SortableEvent extends AbstractEvent {
	static type = 'sortable';

	get sortable() {
		return this.data.sortable || null;
	}
}

export class SortableInitEvent extends SortableEvent {
	static type = 'sortable:init';
}

export class SortableActivateEvent extends SortableEvent {
	static type = 'sortable:activate';

	get sensorEvent() {
		return this.data.sensorEvent || null;
	}

	get draggable() {
		return this.data.draggable || null;
	}

	get peerSortable() {
		return this.data.sortable || null;
	}
}

export class SortableOverEvent extends SortableActivateEvent {
	static type = 'sortable:over';
}

export class SortableChangeEvent extends SortableEvent {
	static type = 'sortable:change';
}

export class SortableRemoveEvent extends SortableEvent {
	static type = 'sortable:remove';

	get item() {
		return this.data.item || null;
	}

	get previousIndex() {
		return this.data.previousIndex || null;
	}

	get peerSortable() {
		return this.data.peerSortable || null;
	}
}

export class SortableReceiveEvent extends SortableEvent {
	static type = 'sortable:receive';

	get item() {
		return this.data.item || null;
	}

	get newIndex() {
		return this.data.newIndex || null;
	}

	get draggable() {
		return this.data.draggable || null;
	}

	get peerSortable() {
		return this.data.peerSortable || null;
	}
}

export class SortableUpdateEvent extends SortableEvent {
	static type = 'sortable:update';

	get item() {
		return this.data.item || null;
	}

	get previousIndex() {
		return this.data.previousIndex || null;
	}

	get newIndex() {
		return this.data.newIndex || null;
	}

	get peerSortable() {
		return this.data.peerSortable || null;
	}
}

export class SortableOutEvent extends SortableActivateEvent {
	static type = 'sortable:out';
}

export class SortableDeactivateEvent extends SortableActivateEvent {
	static type = 'sortable:deactivate';
}

export class SortableDestroyEvent extends SortableEvent {
	static type = 'sortable:destroy';
}
