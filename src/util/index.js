/* global MouseEvent */
import { activeElement, attribute, contains, listen, matches, style } from 'dom-helpers';
import { injectGlobal } from '@emotion/css';
import forEach from 'lodash/forEach';
import isPlainObject from 'lodash/isPlainObject';
import kebabCase from 'lodash/kebabCase';
import { MouseStopEvent } from '../sensor/mouse-event';

const toArray = Function.prototype.bind.call(Function.prototype.call, [].slice);

const show = element => {
	if (element) {
		const previous = element.previousDisplay || null;

		style(element, {
			display: previous || ''
		});
	}
};

const hide = element => {
	if (element) {
		element.previousDisplay = style(element, 'display') || null;
		style(element, {
			display: 'none'
		});
	}
};

const disableSelection = element => {
	if (element) {
		const eventName = 'onselectstart' in document.createElement('div') ? 'selectstart' : 'mousedown';

		return listen(element, eventName, event => event.preventDefault());
	}

	return null;
};

const getParents = (element, until = null) => {
	let nextNode = element;
	const parents = [];

	while (nextNode && nextNode.parentNode && nextNode.parentNode !== document) {
		if (until && matches(nextNode.parentNode, until)) {
			break;
		}
		parents.push(nextNode.parentNode);
		nextNode = nextNode.parentNode;
	}

	return parents;
};

const getSibling = (element, direction, skip) => {
	let sibling = null;
	let nextNode = element;
	const prop = direction === 'previous' ? 'previousElementSibling' : 'nextElementSibling';

	while (nextNode && nextNode[prop]) {
		if (skip && matches(nextNode[prop], skip)) {
			nextNode = nextNode[prop];
		} else {
			sibling = nextNode[prop];
			break;
		}
	}

	return sibling;
};

const getChildIndex = element => {
	let index = 0;
	let nextNode = element;

	while (nextNode && nextNode.previousElementSibling) {
		nextNode = nextNode.previousElementSibling;
		index++;
	}

	return index;
};

const containsStrict = (reference, element) => reference !== element && contains(reference, element);

const insertBefore = (element, reference) => {
	if (element && reference && reference.parentNode) {
		reference.parentNode.insertBefore(element, reference);
	}
	return element;
};

const insertAfter = (element, reference) => {
	if (element && reference && reference.parentNode) {
		if (reference.nextSibling) {
			reference.parentNode.insertBefore(element, reference.nextSibling);
		} else {
			reference.parentNode.appendChild(element);
		}
	}
	return element;
};

const createElement = (tag, attrs = null, parent = null, contents = null) => {
	const node = document.createElement(tag);

	if (isPlainObject(attrs)) {
		forEach(attrs, (value, name) => {
			attribute(node, name, value);
		});
	}

	if (parent && parent.nodeType === 1) {
		parent.appendChild(node);
	}

	if (contents) {
		node.innerHTML = contents;
	}

	return node;
};

const createMouseStopEvent = target =>
	new MouseStopEvent({
		target,
		originalEvent: createMouseEvent('mouseup', target)
	});

const createMouseEvent = (type, target) => {
	const eventOptions = {
		button: 0,
		bubbles: true,
		cancelable: true,
		ctrlKey: false,
		altKey: false,
		shiftKey: false,
		metaKey: false,
		clientX: 1,
		clientY: 1,
		screenX: 0,
		screenY: 0,
		view: document.defaultView,
		target,
		relatedTarget: document.documentElement
	};

	return new MouseEvent('mouseup', eventOptions);
};

const triggerEvent = (element, type) => {
	if (element) {
		const event = document.createEvent('HTMLEvents');

		event.initEvent(type, false, true);
		element.dispatchEvent(event);
	}
};

const blurActiveElement = event => {
	const active = activeElement();

	if (!containsStrict(active, event.target) && active !== document.body) {
		triggerEvent(active, 'blur');
	}
};

const isFloating = element => /(left|right)/.test(style(element, 'float') || /(inline|table-cell)/.test(style(element, 'display')));

const getPaddingAndBorder = element => {
	const dimensions = [];
	const borders = [style(element, 'borderTop'), style(element, 'borderRight'), style(element, 'borderBottom'), style(element, 'borderLeft')];
	const paddings = [style(element, 'paddingTop'), style(element, 'paddingRight'), style(element, 'paddingBottom'), style(element, 'paddingLeft')];

	for (let i = 0; i < 4; i++) {
		dimensions[i] = (parseFloat(borders[i]) || 0) + (parseFloat(paddings[i]) || 0);
	}

	return {
		width: dimensions[1] + dimensions[3],
		height: dimensions[0] + dimensions[2]
	};
};

const setPositionRelative = element => {
	const pos = style(element, 'position');

	if (!/^(?:r|a|f)/.test(pos)) {
		style(element, {
			position: 'relative'
		});
	}
};

const setPositionAbsolute = element => {
	const pos = style(element, 'position');

	if (!/^(?:fixed|absolute)/.test(pos)) {
		style(element, {
			position: 'absolute'
		});
	}
};

const styleAsNumber = (element, prop) => {
	return parseInt(style(element, prop), 10) || 0;
};

const scrollParent = (element, includeHidden = true) => {
	const position = style(element, 'position');
	const excludeStatic = position === 'absolute';

	if (position === 'fixed') {
		return document;
	}

	const regex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
	const filtered = getParents(element).filter(parent => {
		if (excludeStatic && style(parent, 'position') === 'static') {
			return false;
		}
		return regex.test(style(parent, 'overflow') + style(parent, 'overflowX') + style(parent, 'overflowY'));
	});

	return filtered.length > 0 ? filtered[0] : document;
};

const intersect = (source, target, tolerance, event) => {
	switch (tolerance) {
		case 'fit':
			return source.left >= target.left && source.top >= target.top && source.right >= target.right && source.bottom >= target.bottom;
		case 'intersect':
			return (
				target.left < source.left + source.width / 2 &&
				target.right > source.right - source.width / 2 &&
				target.top < source.top + source.height / 2 &&
				target.bottom > source.bottom - source.height / 2
			);
		case 'pointer':
			return event.pageX > target.left && event.pageX < target.right && event.pageY > target.top && event.pageY < target.bottom;
		case 'touch':
			return (
				((source.left >= target.left && source.left <= target.right) ||
					(source.right >= target.left && source.right <= target.right) ||
					(source.left < target.left && source.right > target.right)) &&
				((source.top >= target.top && source.top <= target.top) ||
					(source.bottom >= target.bottom && source.bottom <= target.bottom) ||
					(source.top < target.top && source.bottom > target.bottom))
			);
		default:
			return false;
	}
};

const isRoot = (element, includeBody = true) =>
	element === document || element === document.documentElement || (includeBody && element === document.body);

const injectStyles = (className, rules) => {
	const buffer = [`.${className} {`];

	forEach(rules, (value, name) => {
		buffer.push(`${kebabCase(name)}: ${value};`);
	});

	buffer.push('}');
	injectGlobal(buffer.join('\n'));
};

export {
	toArray,
	show,
	hide,
	disableSelection,
	getParents,
	getSibling,
	getChildIndex,
	containsStrict as contains,
	insertBefore,
	insertAfter,
	createElement,
	createMouseStopEvent,
	createMouseEvent,
	triggerEvent,
	blurActiveElement,
	isFloating,
	getPaddingAndBorder,
	setPositionRelative,
	setPositionAbsolute,
	styleAsNumber,
	scrollParent,
	intersect,
	isRoot,
	injectStyles
};

export default {
	toArray,
	show,
	hide,
	disableSelection,
	getParents,
	getSibling,
	getChildIndex,
	contains: containsStrict,
	insertBefore,
	insertAfter,
	createElement,
	createMouseStopEvent,
	createMouseEvent,
	triggerEvent,
	blurActiveElement,
	isFloating,
	getPaddingAndBorder,
	setPositionRelative,
	setPositionAbsolute,
	styleAsNumber,
	scrollParent,
	intersect,
	isRoot,
	injectStyles
};
