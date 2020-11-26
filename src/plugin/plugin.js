import isUndefined from 'lodash/isUndefined';

export default class Plugin {
	draggable = null;

	constructor(draggable) {
		this.draggable = draggable;
	}

	get startEvent() {
		return !isUndefined(this.draggable.items) ? 'sort:start' : 'drag:start';
	}

	get moveEvent() {
		return !isUndefined(this.draggable.items) ? 'sort:move' : 'drag:move';
	}

	get stopEvent() {
		return !isUndefined(this.draggable.items) ? 'sort:stop' : 'drag:stop';
	}

	attach() {
		this.draggable.on(this.startEvent, this.onDragStart);
		this.draggable.on(this.moveEvent, this.onDragMove);
		this.draggable.on(this.stopEvent, this.onDragStop);
	}

	detach() {
		this.draggable.off(this.startEvent, this.onDragStart);
		this.draggable.off(this.moveEvent, this.onDragMove);
		this.draggable.off(this.stopEvent, this.onDragStop);
	}

	onDragStart(event) {}

	onDragMove(event) {}

	onDragStop(event) {}

	constraintPosition = pos => pos;
}
