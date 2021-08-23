import Plugin from './plugin';

export default class AxisConstraint extends Plugin {
	constructor(container) {
		super(container);
		this.attach();
	}

	get supported() {
		return this.isDraggable() || this.isSortable();
	}

	get axis() {
		const { axis = null } = this.container.options;

		return axis;
	}

	constraintPosition = pos => {
		const { startEvent } = this.container;

		if (this.axis === 'y') {
			pos.pageX = startEvent.pageX;
		} else if (this.axis === 'x') {
			pos.pageY = startEvent.pageY;
		}

		return pos;
	};
}
