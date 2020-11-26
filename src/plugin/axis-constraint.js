import Plugin from './plugin';

export default class AxisConstraint extends Plugin {
	constructor(draggable) {
		super(draggable);
		this.attach();
	}

	get axis() {
		const { axis = null } = this.draggable.options;

		return axis;
	}

	constraintPosition = pos => {
		const { startEvent } = this.draggable;

		if (this.axis === 'y') {
			pos.pageX = startEvent.pageX;
		} else if (this.axis === 'x') {
			pos.pageY = startEvent.pageY;
		}

		return pos;
	};
}
