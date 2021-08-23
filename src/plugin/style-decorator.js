/* global HTMLElement */
import { style } from 'dom-helpers';
import isUndefined from 'lodash/isUndefined';
import Plugin from './plugin';

export default class StyleDecorator extends Plugin {
	static propertyCache = [];

	property = null;

	target = null;

	previousValue = null;

	constructor(container, property, target = null) {
		super(container);
		this.property = property;
		this.target = target ? (target instanceof HTMLElement ? target : document.querySelector(target)) : null;
		this.attach();
	}

	get supported() {
		return this.isDraggable() || this.isSortable();
	}

	detach() {
		this.constructor.propertyCache = [];
		super.detach();
	}

	get value() {
		const { options } = this.container;

		return this.property && !isUndefined(options[this.property]) ? options[this.property] : null;
	}

	isSortableInDraggable() {
		return this.isDraggable() && this.container.connectedDraggable;
	}

	onDragStart = event => {
		if (!this.target) {
			this.target = this.container.helper;
		}
		if (this.value !== null && !this.isSortableInDraggable()) {
			this.previousValue = this.getPreviousValue();
			style(this.target, {
				[this.property]: this.value
			});
		}
	};

	onDragStop = event => {
		if (this.previousValue !== null) {
			style(this.target, {
				[this.property]: this.previousValue
			});
			this.target = null;
		}
	};

	getPreviousValue() {
		const { propertyCache } = this.constructor;
		let entry = propertyCache.find(item => item.element === this.target && item.property === this.property);

		if (!entry) {
			entry = {
				element: this.target,
				property: this.property,
				value: style(this.target, this.property)
			};
			propertyCache.push(entry);
		}

		return entry.value;
	}
}
