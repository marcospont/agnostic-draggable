/* eslint-disable no-useless-return */
/* global HTMLElement */
import anime from 'animejs/lib/anime.es';
import forEach from 'lodash/forEach';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import {
	addClass,
	closest,
	height,
	listen,
	offset,
	offsetParent,
	position,
	querySelectorAll,
	removeClass,
	scrollLeft,
	scrollTop,
	style,
	width
} from 'dom-helpers';

import DragDropManager from '../manager';
import EventEmitter from '../event/event-emitter';
import { DraggableInitEvent, DraggableDestroyEvent } from './draggable-event';
import { DragStartEvent, DragMoveEvent, DragStopEvent } from './drag-event';
import {
	Plugin,
	AxisConstraint,
	ContainmentConstraint,
	GridConstraint,
	StyleDecorator,
	StackController,
	AutoScroll,
	ConnectToSortable
} from '../plugin';
import { Sensor, MouseSensor } from '../sensor';
import {
	blurActiveElement,
	contains,
	createMouseStopEvent,
	getParents,
	isRoot,
	setPositionAbsolute,
	setPositionRelative,
	scrollParent,
	triggerEvent
} from '../util';
import { draggableProp, draggableEl, draggableHandle, draggableHelper } from '../util/constants';

export default class Draggable {
	static defaultOptions = {
		appendTo: 'parent',
		axis: null,
		connectToSortable: null,
		containment: null,
		cursor: null,
		disabled: false,
		distance: 0,
		grid: null,
		handle: null,
		helper: 'original',
		opacity: null,
		revert: false,
		revertDuration: 200,
		scope: 'default',
		scroll: true,
		scrollSensitivity: 20,
		scrollSpeed: 10,
		stack: null,
		skip: 'input, textarea, button, select, option',
		zIndex: null
	};

	element = null;

	margins = null;

	dragging = false;

	reverting = false;

	helper = null;

	helperSize = null;

	helperAttrs = null;

	startEvent = null;

	offset = {
		element: null,
		click: null,
		scroll: null,
		parent: null,
		relative: null
	};

	position = {
		original: null,
		current: null,
		absolute: null
	};

	emitter = new EventEmitter();

	options = {};

	plugins = [];

	sensors = [];

	pendingDestroy = false;

	cancelHelperRemoval = false;

	containmentCoords = undefined;

	containmentContainer = null;

	scrollListeners = [];

	connectedSortables = [];

	droppedSortable = null;

	constructor(element, options = {}, listeners = {}) {
		if (element instanceof HTMLElement) {
			this.element = element;
		} else {
			throw new Error('Invalid element');
		}
		this.options = {
			...this.constructor.defaultOptions,
			...(isPlainObject(options) ? options : {})
		};
		if (isPlainObject(listeners)) {
			forEach(listeners, (callback, type) => {
				this.on(type, callback);
			});
		}
		setTimeout(() => {
			this.setup();
		}, 0);
	}

	addPlugin(plugin) {
		if (plugin instanceof Plugin) {
			this.plugins.push(plugin);
		}
	}

	addSensor(sensor) {
		if (sensor instanceof Sensor) {
			this.sensors.push(sensor);
		}
	}

	setDisabled(value) {
		this.options.disabled = !!value;
	}

	on(type, callback) {
		this.emitter.on(type, callback);
	}

	off(type, callback) {
		this.emitter.off(type, callback);
	}

	cancel() {
		if (this.dragging) {
			this.onDragCancel(createMouseStopEvent(this.helper));
		} else {
			this.clear();
		}
	}

	destroy() {
		if (this.dragging) {
			this.pendingDestroy = true;
			return;
		}

		this.plugins.forEach(plugin => plugin.detach());
		this.sensors.forEach(sensor => sensor.detach());
		document.removeEventListener('mouse:start', this.onDragStart);
		document.removeEventListener('mouse:move', this.onDragMove);
		document.removeEventListener('mouse:stop', this.onDragStop);

		delete this.element[this.dataProperty];
		removeClass(this.element, this.elementClass);
		this.findHandles().forEach(handle => {
			removeClass(handle, this.handleClass);
		});

		this.trigger(
			new DraggableDestroyEvent({
				draggable: this
			})
		);
	}

	get disabled() {
		return this.options.disabled;
	}

	get dataProperty() {
		return draggableProp;
	}

	get elementClass() {
		return draggableEl;
	}

	get handleClass() {
		return draggableHandle;
	}

	get helperClass() {
		return draggableHelper;
	}

	get scope() {
		return this.options.scope;
	}

	get proportions() {
		const { absolute } = this.position;
		const { margins, helperSize } = this;

		return {
			left: absolute.left + margins.left,
			top: absolute.top + margins.top,
			right: absolute.left + margins.left + helperSize.width,
			bottom: absolute.top + margins.top + helperSize.height,
			width: helperSize.width,
			height: helperSize.height
		};
	}

	setup = () => {
		this.addPlugin(new AxisConstraint(this));
		this.addPlugin(new ContainmentConstraint(this));
		this.addPlugin(new GridConstraint(this));
		this.addPlugin(new StyleDecorator(this, 'cursor'));
		this.addPlugin(new StyleDecorator(this, 'opacity'));
		this.addPlugin(new StyleDecorator(this, 'zIndex'));
		this.addPlugin(new StackController(this));
		this.addPlugin(new AutoScroll(this));
		this.addPlugin(new ConnectToSortable(this));
		this.addSensor(new MouseSensor(this));
		document.addEventListener('mouse:start', this.onDragStart);
		document.addEventListener('mouse:move', this.onDragMove);
		document.addEventListener('mouse:stop', this.onDragStop);

		if (this.options.helper === 'original') {
			setPositionRelative(this.element);
		}

		this.element[this.dataProperty] = this;
		addClass(this.element, this.elementClass);
		this.findHandles().forEach(handle => {
			addClass(handle, this.handleClass);
		});

		this.trigger(
			new DraggableInitEvent({
				draggable: this
			})
		);
	};

	onDragStart = event => {
		const sensorEvent = event.detail;

		if (sensorEvent.caller !== this) {
			return;
		}

		if (this.disabled || this.reverting) {
			sensorEvent.cancel();
			return;
		}

		if (!this.isInsideHandle(sensorEvent)) {
			sensorEvent.cancel();
			return;
		}

		blurActiveElement(sensorEvent);

		this.helper = this.createHelper(sensorEvent);
		if (!this.helper) {
			sensorEvent.cancel();
			this.clear();
			return;
		}

		addClass(this.helper, this.helperClass);
		this.cacheMargins();
		this.dragging = true;
		this.cacheHelperSize();
		this.cacheHelperAttrs();
		this.startEvent = sensorEvent;
		this.position.absolute = offset(this.element);
		this.calculateOffsets(sensorEvent);
		this.calculatePosition(sensorEvent, false);

		const dragStart = new DragStartEvent({
			source: this.element,
			helper: this.helper,
			sensorEvent,
			originalEvent: sensorEvent.originalEvent
		});

		this.trigger(dragStart);
		if (dragStart.canceled) {
			sensorEvent.cancel();
			this.clear();
			return;
		}

		this.cacheHelperSize();

		DragDropManager.prepareOffsets(this, sensorEvent);

		this.onDragMove(event, true);

		this.scrollListeners = getParents(this.element, 'body').map(parent =>
			listen(parent, 'scroll', () => DragDropManager.prepareOffsets(this, event))
		);
	};

	onDragMove = (event, noPropagation = false) => {
		const sensorEvent = event.detail;

		if (sensorEvent.caller !== this) {
			return;
		}

		const { hasFixedParent } = this.helperAttrs;

		if (hasFixedParent) {
			this.offset.parent = this.getParentOffset();
		}

		this.calculatePosition(sensorEvent);

		const dragMove = new DragMoveEvent({
			source: this.element,
			helper: this.helper,
			sensorEvent,
			originalEvent: sensorEvent.originalEvent,
			position: this.position.current
		});

		if (!noPropagation) {
			this.trigger(dragMove);
		} else {
			this.plugins.forEach(plugin => {
				if (!dragMove.canceled) {
					plugin.onDragMove(dragMove);
				}
			});
		}
		if (dragMove.canceled) {
			this.onDragCancel(createMouseStopEvent(this.helper));
			return;
		} else {
			this.position.current = dragMove.position;
		}

		style(this.helper, {
			left: this.position.current.left + 'px',
			top: this.position.current.top + 'px'
		});

		DragDropManager.onDragMove(this, sensorEvent);
	};

	onDragCancel = event => {
		const sensorEvent = event.detail;

		this.scrollListeners.forEach(listener => listener());
		this.scrollListeners = [];

		DragDropManager.onDragStop(this, sensorEvent);

		if (this.findHandles().some(handle => handle === sensorEvent.target)) {
			triggerEvent(this.element, 'focus');
		}

		this.sensors.forEach(sensor => sensor.cancel(event));
	};

	onDragStop = event => {
		const sensorEvent = event.detail;

		if (sensorEvent.caller !== this) {
			return;
		}

		const { revert, revertDuration } = this.options;
		const { original } = this.position;

		const dragStop = new DragStopEvent({
			source: this.element,
			helper: this.helper,
			droppable: DragDropManager.drop(this, sensorEvent),
			sensorEvent,
			originalEvent: sensorEvent.originalEvent
		});

		if (
			(revert === 'invalid' && !dragStop.droppable) ||
			(revert === 'valid' && dragStop.droppable) ||
			revert ||
			(isFunction(revert) && revert(this.element, dragStop.droppable))
		) {
			this.reverting = true;
			anime({
				targets: [this.helper],
				left: original.left + 'px',
				top: original.top + 'px',
				duration: revertDuration,
				easing: 'linear',
				complete: () => {
					this.reverting = false;
					this.trigger(dragStop);
					if (!dragStop.canceled) {
						this.clear();
					}
				}
			});
		} else {
			this.trigger(dragStop);
			if (!dragStop.canceled) {
				this.clear();
			}
		}
	};

	trigger(event) {
		this.emitter.emit(event.type, event);
		if (/^drag:/.test(event.type)) {
			this.position.absolute = this.convertPosition(this.position.current, 'absolute');
		}
	}

	findHandles() {
		let handles = null;
		const { handle } = this.options;

		if (handle) {
			handles = querySelectorAll(this.element, handle);
		} else {
			handles = [this.element];
		}

		return handles;
	}

	isInsideHandle(event) {
		let inside = false;

		this.findHandles().forEach(handle => {
			if (!inside && (handle === event.target || contains(handle, event.target))) {
				inside = true;
			}
		});

		return inside;
	}

	createHelper(event) {
		let helperNode = null;
		const { appendTo, helper } = this.options;

		if (isFunction(helper)) {
			helperNode = helper.apply(this.element, [event]);
		} else if (helper === 'clone') {
			helperNode = this.element.cloneNode(true);
			helperNode.removeAttribute('id');
			helperNode.removeAttribute(this.dataProperty);
			helperNode[this.dataProperty] = this;
		} else {
			helperNode = this.element;
		}
		if (helperNode instanceof HTMLElement) {
			if (!closest(helperNode, 'body')) {
				const parent = appendTo === 'parent' ? this.element.parentNode : document.querySelector(appendTo);

				if (parent instanceof HTMLElement) {
					parent.appendChild(helperNode);
				}
			}
			if (isFunction(helper) && helperNode === this.element) {
				setPositionRelative(this.element);
			}
			if (helperNode !== this.element) {
				setPositionAbsolute(helperNode);
			}

			return helperNode;
		}

		return null;
	}

	cacheMargins() {
		this.margins = {
			left: parseInt(style(this.element, 'marginLeft'), 10) || 0,
			top: parseInt(style(this.element, 'marginTop'), 10) || 0,
			right: parseInt(style(this.element, 'marginRight'), 10) || 0,
			bottom: parseInt(style(this.element, 'marginBottom'), 10) || 0
		};
	}

	cacheHelperSize() {
		this.helperSize = {
			width: width(this.helper),
			height: height(this.helper)
		};
	}

	cacheHelperAttrs() {
		this.helperAttrs = {
			cssPosition: style(this.helper, 'position'),
			scrollParent: scrollParent(this.helper, false),
			offsetParent: offsetParent(this.helper),
			hasFixedParent: getParents(this.helper).some(parent => style(parent, 'position') === 'fixed')
		};
	}

	calculateOffsets(event) {
		const { absolute } = this.position;

		this.offset.click = {
			left: event.pageX - absolute.left - this.margins.left,
			top: event.pageY - absolute.top - this.margins.top
		};
		this.offset.parent = this.getParentOffset();
		this.offset.relative = this.getRelativeOffset();
	}

	getParentOffset() {
		const { cssPosition, scrollParent, offsetParent } = this.helperAttrs;
		const result = isRoot(offsetParent)
			? {
					left: 0,
					top: 0
			  }
			: offset(offsetParent);

		if (cssPosition === 'absolute' && scrollParent !== document && contains(scrollParent, offsetParent)) {
			result.left += scrollLeft(scrollParent);
			result.top += scrollTop(scrollParent);
		}

		return {
			left: result.left + parseInt(style(offsetParent, 'borderLeftWidth'), 10) || 0,
			top: result.top + parseInt(style(offsetParent, 'borderTopWidth'), 10) || 0
		};
	}

	getRelativeOffset() {
		const { cssPosition, scrollParent } = this.helperAttrs;

		if (cssPosition !== 'relative') {
			return {
				left: 0,
				top: 0
			};
		}

		const result = position(this.helper);
		const scrollIsRoot = scrollParent ? isRoot(scrollParent) : false;

		return {
			left: result.left - (parseInt(style(this.helper, 'left'), 10) || 0) + (scrollIsRoot ? scrollLeft(scrollParent) : 0),
			top: result.top - (parseInt(style(this.helper, 'top'), 10) || 0) + (scrollIsRoot ? scrollTop(scrollParent) : 0)
		};
	}

	constraintPosition(event) {
		let position = {
			pageX: event.pageX,
			pageY: event.pageY
		};

		this.plugins.forEach(plugin => {
			position = plugin.constraintPosition(position);
		});

		return position;
	}

	calculatePosition(event, constraint = true) {
		const { pageX, pageY } = constraint ? this.constraintPosition(event) : event;
		const { cssPosition, offsetParent, scrollParent } = this.helperAttrs;
		const scrollIsRoot = isRoot(scrollParent);

		if (!scrollIsRoot || !this.offset.scroll) {
			this.offset.scroll = {
				left: scrollIsRoot ? 0 : scrollLeft(scrollParent),
				top: scrollIsRoot ? 0 : scrollTop(scrollParent)
			};
		}

		if (cssPosition === 'relative' && scrollParent === document && scrollParent !== offsetParent) {
			this.offset.relative = this.getRelativeOffset();
		}

		const { click, scroll, parent, relative } = this.offset;
		const position = {
			left: pageX - click.left - parent.left - relative.left + (cssPosition === 'fixed' ? -scroll.left : scrollIsRoot ? 0 : scroll.left),
			top: pageY - click.top - parent.top - relative.top + (cssPosition === 'fixed' ? -scroll.top : scrollIsRoot ? 0 : scroll.top)
		};

		if (!this.position.original) {
			this.position.original = position;
		}
		this.position.current = position;
		this.position.absolute = this.convertPosition(position, 'absolute');
	}

	convertPosition(position, to) {
		const { cssPosition, scrollParent } = this.helperAttrs;
		const { scroll, parent, relative } = this.offset;
		const factor = to === 'absolute' ? 1 : -1;
		const scrollIsRoot = isRoot(scrollParent);

		return {
			left:
				position.left +
				parent.left * factor +
				relative.left * factor -
				(cssPosition === 'fixed' ? -scroll.left : (scrollIsRoot ? 0 : scroll.left) * factor),
			top:
				position.top +
				parent.top * factor +
				relative.top * factor -
				(cssPosition === 'fixed' ? -scroll.top : (scrollIsRoot ? 0 : scroll.top) * factor)
		};
	}

	clear() {
		if (this.helper) {
			const { helper } = this.options;

			removeClass(this.helper, this.helperClass);
			this.dragging = false;
			if (this.helper && helper === 'clone' && !this.cancelHelperRemoval) {
				this.helper.parentNode.removeChild(this.helper);
			}
			this.cancelHelperRemoval = false;
			this.helper = null;
			if (this.pendingDestroy) {
				this.destroy();
				this.pendingDestroy = false;
			}
		}
	}
}
