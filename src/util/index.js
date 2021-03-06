import { activeElement, contains, matches, style } from 'dom-helpers';
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

const createMouseStopEvent = target =>
	new MouseStopEvent({
		target,
		originalEvent: createEvent('mouseup', target)
	});

const createEvent = (type, target) => {
	const event = document.createEvent('HTMLEvents');

	event.initEvent(type, false, true);
	event.target = target;

	return event;
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

export {
	toArray,
	show,
	hide,
	getParents,
	getSibling,
	containsStrict as contains,
	insertBefore,
	insertAfter,
	createMouseStopEvent,
	createEvent,
	triggerEvent,
	blurActiveElement,
	isFloating,
	setPositionRelative,
	setPositionAbsolute,
	styleAsNumber,
	scrollParent,
	intersect,
	isRoot
};

export default {
	toArray,
	show,
	hide,
	getParents,
	getSibling,
	contains: containsStrict,
	insertBefore,
	insertAfter,
	createMouseStopEvent,
	createEvent,
	triggerEvent,
	blurActiveElement,
	isFloating,
	setPositionRelative,
	setPositionAbsolute,
	styleAsNumber,
	scrollParent,
	intersect,
	isRoot
};
