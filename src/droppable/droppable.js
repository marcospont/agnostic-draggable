/* global HTMLElement */
import forEach from 'lodash/forEach';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import { addClass, height, matches, offset, querySelectorAll, removeClass, style, width } from 'dom-helpers';

import DragDropManager from '../manager';
import EventEmitter from '../event/event-emitter';
import {
	DroppableInitEvent,
	DroppableActivateEvent,
	DroppableOverEvent,
	DroppableDropEvent,
	DroppableOutEvent,
	DroppableDeactivateEvent,
	DroppableDestroyEvent
} from './droppable-event';
import { intersect } from '../util';
import { droppableProp, droppableEl, droppableActive, droppableHover } from '../util/constants';

export default class Droppable {
	static defaultOptions = {
		accept: '*',
		disabled: false,
		greedy: false,
		scope: 'default',
		tolerance: 'intersect'
	};

	element = null;

	isOver = false;

	visible = true;

	greedyChild = false;

	emitter = new EventEmitter();

	options = {};

	size = null;

	offset = null;

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
		setTimeout(this.setup, 0);
	}

	setDisabled(value) {
		this.options.disabled = !!value;
	}

	destroy() {
		const { scope } = this.options;

		delete this.element[this.dataProperty];
		removeClass(this.element, this.elementClass);
		DragDropManager.removeDroppable(this, scope);

		this.trigger(
			new DroppableDestroyEvent({
				droppable: this
			})
		);
	}

	get disabled() {
		return this.options.disabled;
	}

	get dataProperty() {
		return droppableProp;
	}

	get elementClass() {
		return droppableEl;
	}

	get activeClass() {
		return droppableActive;
	}

	get hoverClass() {
		return droppableHover;
	}

	get greedy() {
		return this.options.greedy;
	}

	get scope() {
		return this.options.scope;
	}

	get proportions() {
		if (!this.offset) {
			this.offset = offset(this.element);
		}
		if (!this.size) {
			this.size = {
				width: width(this.element),
				height: height(this.element)
			};
		}

		return {
			left: this.offset.left,
			top: this.offset.top,
			right: this.offset.left + this.size.width,
			bottom: this.offset.top + this.size.height,
			width: this.size.width,
			height: this.size.height
		};
	}

	setup = () => {
		const { scope } = this.options;

		this.element[this.dataProperty] = this;
		addClass(this.element, this.elementClass);
		DragDropManager.addDroppable(this, scope);

		this.trigger(
			new DroppableInitEvent({
				droppable: this
			})
		);
	};

	refreshVisibility() {
		this.visible = style(this.element, 'display') !== 'none';
	}

	refreshProportions() {
		this.offset = offset(this.element);
		this.size = {
			width: width(this.element),
			height: height(this.element)
		};
	}

	intersect(draggable, event) {
		const { tolerance } = this.options;

		if (this.disabled || this.greedyChild || !this.visible) {
			return false;
		}

		return intersect(draggable.proportions, this.proportions, tolerance, event);
	}

	accept(draggable) {
		const { accept } = this.options;

		if (this.disabled || !this.visible) {
			return false;
		}

		if (draggable) {
			return isFunction(accept)
				? accept(draggable.currentItem || draggable.element)
				: matches(draggable.currentItem || draggable.element, accept);
		}

		return false;
	}

	activate(event) {
		const draggable = DragDropManager.draggable;

		addClass(this.element, this.activeClass);
		if (draggable) {
			this.trigger(
				new DroppableActivateEvent({
					droppable: this,
					sensorEvent: event,
					draggable
				})
			);
		}
	}

	over(event) {
		const draggable = DragDropManager.draggable;

		if (draggable && (draggable.currentItem || draggable.element) !== this.element && this.accept(draggable)) {
			addClass(this.element, this.hoverClass);
			this.isOver = true;
			this.trigger(
				new DroppableOverEvent({
					droppable: this,
					sensorEvent: event,
					draggable
				})
			);
		}
	}

	drop(event) {
		const draggable = DragDropManager.draggable;
		let childIntersection = false;

		if (draggable && (draggable.currentItem && draggable.element) !== this.element) {
			const childDroppables = querySelectorAll(this.element, ':not(.ui-draggable-dragging)').filter(element => element[this.dataProperty]);

			childDroppables.forEach(child => {
				const droppable = child[this.dataProperty];

				if (
					!childIntersection &&
					droppable.greedy &&
					droppable.scope === draggable.scope &&
					droppable.intersect(draggable, event) &&
					droppable.accept(draggable)
				) {
					childIntersection = true;
				}
			});

			if (childIntersection) {
				return null;
			}

			if (this.accept(draggable)) {
				removeClass(this.element, this.activeClass);
				removeClass(this.element, this.hoverClass);
				this.isOver = false;
				this.trigger(
					new DroppableDropEvent({
						droppable: this,
						sensorEvent: event,
						draggable
					})
				);
				return this;
			}
		}

		return null;
	}

	out(event) {
		const draggable = DragDropManager.draggable;

		if (draggable && (draggable.currentItem || draggable.element) !== this.element && this.accept(draggable)) {
			removeClass(this.element, this.hoverClass);
			this.isOver = false;
			this.trigger(
				new DroppableOutEvent({
					droppable: this,
					sensorEvent: event,
					draggable
				})
			);
		}
	}

	deactivate(event) {
		const draggable = DragDropManager.draggable;

		removeClass(this.element, this.activeClass);
		this.isOver = false;
		if (draggable) {
			this.trigger(
				new DroppableDeactivateEvent({
					droppable: this,
					sensorEvent: event,
					draggable
				})
			);
		}
	}

	on(type, callback) {
		this.emitter.on(type, callback);
	}

	off(type, callback) {
		this.emitter.off(type, callback);
	}

	trigger(event) {
		this.emitter.emit(event.type, event);
	}
}
