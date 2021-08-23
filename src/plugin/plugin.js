import isUndefined from 'lodash/isUndefined';

export default class Plugin {
	container = null;

	constructor(container) {
		this.container = container;
	}

	get supported() {
		return false;
	}

	get startEvent() {
		if (this.isResizable()) {
			return 'resize:start';
		}
		if (this.isSortable()) {
			return 'sort:start';
		}
		return 'drag:start';
	}

	get moveEvent() {
		if (this.isResizable()) {
			return 'resize:change';
		}
		if (this.isSortable()) {
			return 'sort:move';
		}
		return 'drag:move';
	}

	get stopEvent() {
		if (this.isResizable()) {
			return 'resize:stop';
		}
		if (this.isSortable()) {
			return 'sort:stop';
		}
		return 'drag:stop';
	}

	isDraggable() {
		return this.container && !isUndefined(this.container.dragging);
	}

	isSortable() {
		return this.container && !isUndefined(this.container.items);
	}

	isResizable() {
		return this.container && !isUndefined(this.container.resizing);
	}

	attach() {
		if (this.supported) {
			this.container.on(this.startEvent, this.onDragStart);
			this.container.on(this.moveEvent, this.onDragMove);
			this.container.on(this.stopEvent, this.onDragStop);
		}
	}

	detach() {
		if (this.supported) {
			this.container.off(this.startEvent, this.onDragStart);
			this.container.off(this.moveEvent, this.onDragMove);
			this.container.off(this.stopEvent, this.onDragStop);
		}
	}

	onDragStart(event) {}

	onDragMove(event) {}

	onDragStop(event) {}

	constraintPosition = pos => pos;
}
