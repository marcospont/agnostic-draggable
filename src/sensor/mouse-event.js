import SensorEvent from './sensor-event';

export class MouseDownEvent extends SensorEvent {
	static type = 'mouse:down';

	static cancelable = true;
}

export class MouseStartEvent extends SensorEvent {
	static type = 'mouse:start';

	static cancelable = true;
}

export class MouseMoveEvent extends SensorEvent {
	static type = 'mouse:move';
}

export class MouseStopEvent extends SensorEvent {
	static type = 'mouse:stop';
}
