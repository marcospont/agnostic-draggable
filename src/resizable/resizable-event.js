import AbstractEvent from '../event/abstract-event';

class ResizableEvent extends AbstractEvent {
	static type = 'resizable';

	get resizable() {
		return this.data.resizable || null;
	}
}

export class ResizableInitEvent extends ResizableEvent {
	static type = 'resizable:init';
}

export class ResizableDestroyEvent extends ResizableEvent {
	static type = 'resizable:destroy';
}
