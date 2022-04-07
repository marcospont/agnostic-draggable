/* eslint-disable no-useless-return */
import { closest } from 'dom-helpers';

import Sensor from './sensor';
import { MouseDownEvent, MouseStartEvent, MouseMoveEvent, MouseStopEvent } from './mouse-event';

const preventDefault = event => {
	event.preventDefault();
};

export default class MouseSensor extends Sensor {
	pageX = null;

	pageY = null;

	startEvent = null;

	mouseMoved = false;

	constructor(caller) {
		super(caller);
		this.attach();
	}

	attach() {
		document.addEventListener('mousedown', this.onMouseDown, true);
	}

	detach() {
		document.removeEventListener('mousedown', this.onMouseDown, true);
	}

	cancel = event => {
		this.onMouseUp(event);
	};

	onMouseDown = event => {
		if (event.which !== 1 || event.button !== 0 || event.ctrlKey || event.metaKey) {
			return;
		}
		if (this.caller.options.skip && event.target.nodeName && closest(event.target, this.caller.options.skip)) {
			return;
		}
		if (this.active) {
			this.onMouseUp(event);
		}

		const mouseDown = new MouseDownEvent({
			pageX: event.pageX,
			pageY: event.pageY,
			target: event.target,
			caller: this.caller,
			originalEvent: event
		});

		this.pageX = event.pageX;
		this.pageY = event.pageY;
		this.startEvent = event;
		this.trigger(mouseDown);
		if (mouseDown.canceled) {
			return;
		}

		document.addEventListener('dragstart', preventDefault);
		document.addEventListener('mousemove', this.checkThresholds);
		document.addEventListener('mouseup', this.onMouseUp);
	};

	checkThresholds = event => {
		const { startEvent } = this;
		const { distance } = this.caller.options;

		this.pageX = event.pageX;
		this.pageY = event.pageY;

		const delta = Math.max(Math.abs(event.pageX - startEvent.pageX), Math.abs(event.pageY - startEvent.pageY));

		if (delta >= distance) {
			document.removeEventListener('mousemove', this.checkThresholds);
			this.startDrag();
		}
	};

	startDrag() {
		const { startEvent } = this;
		const mouseStart = new MouseStartEvent({
			pageX: startEvent.pageX,
			pageY: startEvent.pageY,
			target: startEvent.target,
			caller: this.caller,
			originalEvent: startEvent
		});

		this.trigger(mouseStart);
		this.active = !mouseStart.canceled;
		if (this.active) {
			document.addEventListener('contextmenu', preventDefault, true);
			document.addEventListener('mousemove', this.onMouseMove);
		}
	}

	onMouseMove = event => {
		if (this.active) {
			this.trigger(
				new MouseMoveEvent({
					pageX: event.pageX,
					pageY: event.pageY,
					target: document.elementFromPoint(event.pageX, event.pageY),
					caller: this.caller,
					originalEvent: event
				})
			);
		}
	};

	onMouseUp = event => {
		clearTimeout(this.startTimeout);
		document.removeEventListener('dragstart', preventDefault);
		document.removeEventListener('mousemove', this.checkThresholds);
		document.removeEventListener('mouseup', this.onMouseUp);
		if (this.active) {
			this.active = false;
			this.trigger(
				new MouseStopEvent({
					pageX: event.pageX,
					pageY: event.pageY,
					target: document.elementFromPoint(event.pageX, event.pageY),
					caller: this.caller,
					originalEvent: event
				})
			);
		}
		document.removeEventListener('contextmenu', preventDefault);
		document.removeEventListener('mousemove', this.onMouseMove);
		event.preventDefault();
	};
}
