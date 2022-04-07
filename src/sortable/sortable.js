/* global HTMLElement */
import anime from 'animejs/lib/anime.es';
import {
	addClass,
	closest,
	height,
	listen,
	offset,
	offsetParent,
	querySelectorAll,
	removeClass,
	scrollLeft,
	scrollParent,
	scrollTop,
	style,
	width
} from 'dom-helpers';
import forEach from 'lodash/forEach';
import isFunction from 'lodash/isFunction';

import Draggable from '../draggable/draggable';
import DragDropManager from '../manager';
import {
	SortableInitEvent,
	SortableActivateEvent,
	SortableOverEvent,
	SortableChangeEvent,
	SortableRemoveEvent,
	SortableReceiveEvent,
	SortableUpdateEvent,
	SortableOutEvent,
	SortableDeactivateEvent,
	SortableDestroyEvent
} from './sortable-event';
import { SortStartEvent, SortMoveEvent, SortStopEvent } from './sort-event';
import { AxisConstraint, DragContainmentConstraint, DragGridConstraint, StyleDecorator, AutoScroll } from '../plugin';
import { MouseSensor } from '../sensor';
import {
	contains,
	createMouseStopEvent,
	getParents,
	getSibling,
	hide,
	insertBefore,
	insertAfter,
	isFloating,
	isRoot,
	setPositionAbsolute,
	show,
	toArray,
	getChildIndex
} from '../util';
import { sortableProp, sortableEl, sortableHandle, sortableHelper, sortablePlaceholder } from '../util/constants';

export default class Sortable extends Draggable {
	static defaultOptions = {
		appendTo: 'parent',
		axis: null,
		connectWith: null,
		containment: null,
		cursor: null,
		disabled: false,
		distance: 0,
		dropOnEmpty: true,
		forceHelperSize: false,
		forcePlaceholderSize: false,
		hidePlaceholder: false,
		grid: null,
		handle: null,
		helper: 'original',
		items: null,
		opacity: null,
		revert: false,
		revertDuration: 200,
		scope: 'default',
		scroll: true,
		scrollSensitivity: 20,
		scrollSpeed: 10,
		skip: 'input, textarea, button, select, option',
		tolerance: 'intersect',
		zIndex: null
	};

	connectedSortables = [];

	currentConnectedSortable = null;

	connectedDraggable = null;

	items = [];

	currentItem = null;

	currentItemStyle = {};

	currentItemProps = null;

	elementProportions = null;

	placeholder = null;

	isOver = false;

	isDraggableOver = false;

	floating = false;

	previousPosition = null;

	resetCurrentItem = false;

	rearrangeIteration = 0;

	cancel() {
		this.resetCurrentItem = true;
		super.cancel();
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
		this.items.forEach(item => delete item.element[this.dataProperty]);
		this.findHandles().forEach(handle => {
			removeClass(handle, this.handleClass);
		});

		this.trigger(
			new SortableDestroyEvent({
				sortable: this
			})
		);
	}

	get dataProperty() {
		return sortableProp;
	}

	get elementClass() {
		return sortableEl;
	}

	get handleClass() {
		return sortableHandle;
	}

	get helperClass() {
		return sortableHelper;
	}

	get placeholderClass() {
		return sortablePlaceholder;
	}

	setup = () => {
		this.addPlugin(new AxisConstraint(this));
		this.addPlugin(new DragContainmentConstraint(this));
		this.addPlugin(new DragGridConstraint(this));
		this.addPlugin(new StyleDecorator(this, 'cursor'));
		this.addPlugin(new StyleDecorator(this, 'opacity'));
		this.addPlugin(new StyleDecorator(this, 'zIndex'));
		this.addPlugin(new AutoScroll(this));
		this.addSensor(new MouseSensor(this));
		document.addEventListener('mouse:down', this.onMouseDown);
		document.addEventListener('mouse:start', this.onDragStart);
		document.addEventListener('mouse:move', this.onDragMove);
		document.addEventListener('mouse:stop', this.onDragStop);

		this.element[this.dataProperty] = this;
		addClass(this.element, this.elementClass);
		this.refresh();
		this.offset.element = offset(this.element);

		this.trigger(
			new SortableInitEvent({
				sortable: this
			})
		);
	};

	onMouseDown = event => {
		const sensorEvent = event.detail;

		if (sensorEvent.caller !== this) {
			return;
		}

		if (this.disabled || this.reverting) {
			sensorEvent.cancel();
			return;
		}

		if (!this.findItem(sensorEvent)) {
			sensorEvent.cancel();
		}
	};

	onDragStart = (event, noActivation = false, forceOwnership = false) => {
		const sensorEvent = event.detail;

		if (sensorEvent.caller !== this && !forceOwnership) {
			return;
		}

		if (this.disabled || this.reverting) {
			sensorEvent.cancel();
			return;
		}

		this.refreshItems();
		this.currentItem = this.findItem(sensorEvent);
		if (!this.currentItem) {
			sensorEvent.cancel();
			return;
		} else {
			this.currentItemProps = {
				previous: this.currentItem.previousElementSibling,
				parent: this.currentItem.parentNode,
				previousIndex: getChildIndex(this.currentItem)
			};
			this.refreshPositions();
		}

		if (!this.isInsideHandle(sensorEvent)) {
			sensorEvent.cancel();
			return;
		}

		this.helper = this.createHelper(sensorEvent);
		if (!this.helper) {
			sensorEvent.cancel();
			return;
		}
		this.createPlaceholder();

		addClass(this.helper, this.helperClass);
		this.cacheMargins();
		this.currentConnectedSortable = this;
		this.dragging = true;
		this.cacheHelperSize();
		this.helperAttrs = {
			scrollParent: scrollParent(this.helper, false)
		};
		this.startEvent = sensorEvent;
		this.calculateOffsets(sensorEvent);
		this.calculatePosition(sensorEvent, false);
		this.items = this.items.filter(item => item.element !== this.currentItem);
		setPositionAbsolute(this.helper);
		this.helperAttrs.cssPosition = 'absolute';
		if (this.helper !== this.currentItem) {
			hide(this.currentItem);
		}

		const sortStart = new SortStartEvent({
			source: this.currentItem,
			sensorEvent,
			originalEvent: sensorEvent.originalEvent
		});

		this.trigger(sortStart);
		if (sortStart.canceled) {
			this.onDragCancel(createMouseStopEvent(this.helper));
			return;
		}

		this.cacheHelperSize();

		if (!noActivation) {
			this.connectedSortables.forEach(sortable => {
				sortable.trigger(
					new SortableActivateEvent({
						sortable,
						sensorEvent,
						peerSortable: this
					})
				);
			});
		}

		DragDropManager.prepareOffsets(this, sensorEvent);

		this.onDragMove(event, true, forceOwnership);

		this.scrollListeners = getParents(this.element, 'body').map(parent =>
			listen(parent, 'scroll', () => DragDropManager.prepareOffsets(this, event))
		);
	};

	onDragCancel = event => {
		const sensorEvent = event.detail;

		this.scrollListeners.forEach(listener => listener());
		this.scrollListeners = [];

		DragDropManager.onDragStop(this, sensorEvent);

		this.sensors.forEach(sensor => sensor.cancel(event));
		this.clear();
	};

	onDragMove = (event, noPropagation = false, forceOwnership = false) => {
		const sensorEvent = event.detail;

		if ((sensorEvent.caller !== this || !this.dragging) && !forceOwnership) {
			return;
		}

		this.calculatePosition(sensorEvent);
		if (!this.previousPosition) {
			this.previousPosition = this.position.absolute;
		}
		if (!noPropagation) {
			const sortMove = new SortMoveEvent({
				source: this.currentItem,
				helper: this.helper,
				placeholder: this.placeholder,
				sensorEvent,
				originalEvent: sensorEvent.originalEvent,
				position: this.position.current
			});

			this.trigger(sortMove);
			if (sortMove.canceled) {
				return;
			}
		}

		style(this.helper, {
			left: this.position.current.left + 'px',
			top: this.position.current.top + 'px'
		});

		let foundItem = null;

		this.items.forEach(item => {
			if (!foundItem && item.instance === this.currentConnectedSortable) {
				const intersection = this.getPointerIntersection(item);

				if (intersection) {
					const { tolerance } = this.options;
					const { element } = item;

					if (
						element !== this.currentItem &&
						element !== this.placeholder[intersection === 1 ? 'nextElementSibling' : 'previousElementSibling'] &&
						!contains(this.placeholder, element)
					) {
						const direction = intersection === 1 ? 'down' : 'up';

						if (tolerance === 'pointer' || this.intersectsWithSides(item)) {
							this.rearrange(null, item, direction);
							this.trigger(
								new SortableChangeEvent({
									sortable: this
								})
							);
							foundItem = item;
						}
					}
				}
			}
		});

		this.contactSortables(sensorEvent);

		DragDropManager.onDragMove(this, sensorEvent);
		this.previousPosition = this.position.absolute;
	};

	onDragStop = (event, forceOwnership = false) => {
		const sensorEvent = event.detail;

		if ((sensorEvent.caller !== this || !this.dragging) && !forceOwnership) {
			return;
		}

		const { revert, revertDuration } = this.options;
		const { original } = this.position;

		const sortStop = new SortStopEvent({
			source: this.currentItem,
			helper: this.helper,
			droppable: DragDropManager.drop(this, sensorEvent),
			sensorEvent,
			originalEvent: sensorEvent.originalEvent
		});

		if (
			(revert === 'invalid' && !sortStop.droppable) ||
			(revert === 'valid' && sortStop.droppable) ||
			(isFunction(revert) && revert(this.currentItem, sortStop.droppable)) ||
			revert
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
					this.trigger(sortStop);
					if (!sortStop.canceled) {
						this.clear();
					}
				}
			});
		} else {
			this.trigger(sortStop);
			if (!sortStop.canceled) {
				this.applyChanges();
				this.clear();
			}
		}
	};

	over(peerSortable = null, draggable = null) {
		if (!this.isOver) {
			this.trigger(
				new SortableOverEvent({
					sortable: this,
					peerSortable,
					draggable
				})
			);
			this.isOver = true;
		}
	}

	out(peerSortable = null, draggable = null) {
		if (this.isOver) {
			this.trigger(
				new SortableOutEvent({
					sortable: this,
					peerSortable,
					draggable
				})
			);
			this.isOver = false;
		}
	}

	refresh() {
		this.refreshItems();
		this.refreshPositions();
		this.findHandles().forEach(handle => {
			addClass(handle, this.handleClass);
		});
	}

	refreshItems() {
		const { connectWith } = this.options;

		this.connectedSortables = [this];
		this.items = this.findItems();

		const connectedSortables = connectWith ? querySelectorAll(document, connectWith) : [];

		connectedSortables.forEach(element => {
			const sortable = element[this.dataProperty];

			if (sortable && sortable !== this && !sortable.disabled) {
				this.items = this.items.concat(sortable.findItems(null, this.currentItem));
				this.connectedSortables.push(sortable);
			}
		});
	}

	refreshPositions() {
		const { axis } = this.options;

		this.floating = this.items.length ? axis === 'x' || isFloating(this.items[0].element) : false;
		if (this.helper && this.helperAttrs && this.helperAttrs.offsetParent) {
			this.offset.parent = this.getParentOffset();
		}

		this.items.forEach(item => {
			if (!this.currentConnectedSortable || this.currentConnectedSortable === this || item.element === this.currentItem) {
				const { width, height, left, top } = offset(item.element);

				item.width = width;
				item.height = height;
				item.left = left;
				item.top = top;
			}
		});

		this.connectedSortables.forEach(sortable => sortable.cacheElementProportions());
	}

	findItem(event) {
		let currentItem = getParents(event.target).find(element => element !== this.element && element[this.dataProperty] === this);

		if (!currentItem && event.target !== this.element && event.target[this.dataProperty] === this) {
			currentItem = event.target;
		}

		return currentItem;
	}

	findItems(filter = null, currentItem = null) {
		let response = [];
		const { items } = this.options;
		const mapToItem = item => {
			item[this.dataProperty] = this;

			return {
				element: item,
				instance: this,
				width: 0,
				height: 0,
				left: 0,
				top: 0
			};
		};

		if (isFunction(items)) {
			response = items({
				options: this.options,
				item: currentItem || this.currentItem
			});
			if (!Array.isArray(response)) {
				return [];
			}
		} else {
			response = items ? querySelectorAll(this.element, items) : toArray(this.element.childNodes).filter(node => node.nodeType === 1);
		}

		return isFunction(filter) ? response.filter(filter).map(mapToItem) : response.map(mapToItem);
	}

	findClosestItem(event, sortable) {
		let closestItem = null;
		let distance = 10000;
		const floating = sortable.floating || isFloating(this.currentItem);
		let nearBottom = false;
		let posValue = null;
		const eventProp = floating ? 'pageX' : 'pageY';

		this.items.forEach(item => {
			if (contains(sortable.element, item.element) && item.element !== this.currentItem) {
				nearBottom = false;
				posValue = offset(item.element)[floating ? 'left' : 'top'];
				if (event[eventProp] - posValue > item[floating ? 'width' : 'height'] / 2) {
					nearBottom = true;
				}
				if (Math.abs(event[eventProp] - posValue) < distance) {
					distance = Math.abs(event[eventProp] - posValue);
					closestItem = item;
				}
			}
		});

		return {
			item: closestItem,
			nearBottom
		};
	}

	findHandles() {
		let handles = [];
		const { handle } = this.options;

		this.items.forEach(item => {
			if (handle) {
				handles = handles.concat(querySelectorAll(item.element, handle));
			} else {
				handles.push(item.element);
			}
		});

		return handles;
	}

	createHelper(event) {
		let helperNode = null;
		const { appendTo, helper, forceHelperSize } = this.options;

		if (isFunction(helper)) {
			helperNode = helper.apply(this.element, [event, this.currentItem]);
		} else if (helper === 'clone') {
			helperNode = this.currentItem.cloneNode(true);
			helperNode.removeAttribute('id');
			helperNode.removeAttribute(this.dataProperty);
			helperNode[this.dataProperty] = this;
		} else {
			helperNode = this.currentItem;
		}
		if (helperNode instanceof HTMLElement) {
			if (!closest(helperNode, 'body')) {
				const parent = appendTo === 'parent' ? this.currentItem.parentNode : document.querySelector(appendTo);

				if (parent instanceof HTMLElement) {
					parent.appendChild(helperNode);
				} else {
					return null;
				}
			}
			if (helperNode === this.currentItem) {
				this.currentItemStyle = {
					width: width(this.currentItem),
					height: height(this.currentItem),
					position: style(this.currentItem, 'position'),
					left: style(this.currentItem, 'left'),
					top: style(this.currentItem, 'top')
				};
			}
			if (!helperNode.style.width || forceHelperSize) {
				style(helperNode, {
					width: width(this.currentItem) + 'px',
					boxSizing: 'border-box'
				});
			}
			if (!helperNode.style.height || forceHelperSize) {
				style(helperNode, {
					height: height(this.currentItem) + 'px',
					boxSizing: 'border-box'
				});
			}

			return helperNode;
		}

		return null;
	}

	createPlaceholder() {
		if (!this.placeholder) {
			const nodeName = this.currentItem.nodeName.toLowerCase();
			const element = document.createElement(nodeName);

			element.className = this.currentItem.className;
			addClass(element, this.placeholderClass);
			removeClass(element, this.helperClass);
			if (nodeName === 'thead' || nodeName === 'tbody') {
				const tableRow = document.createElement('tr');

				element.appendChild(tableRow);
				this.createTableRowPlaceholder(this.currentItem.querySelector('tr'), tableRow, nodeName === 'thead' ? 'th' : 'tr');
			} else if (nodeName === 'tr') {
				this.createTableRowPlaceholder(this.currentItem, element, 'tr');
			} else if (nodeName === 'img') {
				element.setAttribute('src', this.currentItem.getAttribute('src'));
			}
			this.placeholder = insertAfter(element, this.currentItem);
			this.updatePlaceholder(this, element);
		} else {
			this.updatePlaceholder(this, this.placeholder);
		}
	}

	createTableRowPlaceholder(sourceRow, newRow, childTag) {
		querySelectorAll(sourceRow, childTag).forEach(child => {
			const newChild = document.createElement(childTag);

			newChild.innerHTML = '&#160;';
			newChild.setAttribute('colspan', child.getAttribute('colspan'));
			newRow.appendChild(newChild);
		});
	}

	updatePlaceholder(sortable, placeholder) {
		const { forcePlaceholderSize, hidePlaceholder } = sortable.options;

		if (hidePlaceholder) {
			style(placeholder, {
				visibility: 'hidden'
			});
		} else if (forcePlaceholderSize) {
			if (!width(placeholder)) {
				style(placeholder, {
					width: width(this.currentItem) + 'px'
				});
			}
			if (!height(placeholder)) {
				style(placeholder, {
					height: height(this.currentItem) + 'px'
				});
			}
		}
	}

	cacheMargins() {
		this.margins = {
			left: parseInt(style(this.currentItem, 'marginLeft'), 10) || 0,
			top: parseInt(style(this.currentItem, 'marginTop'), 10) || 0,
			right: parseInt(style(this.currentItem, 'marginRight'), 10) || 0,
			bottom: parseInt(style(this.currentItem, 'marginBottom'), 10) || 0
		};
	}

	cacheElementProportions() {
		this.elementProportions = offset(this.element);
	}

	calculateOffsets(event) {
		const itemOffset = offset(this.currentItem);

		this.offset.click = {
			left: event.pageX - itemOffset.left - this.margins.left,
			top: event.pageY - itemOffset.top - this.margins.top
		};
		this.offset.parent = this.getParentOffset();
		this.offset.relative = this.getRelativeOffset();
	}

	getParentOffset() {
		this.helperAttrs.offsetParent = offsetParent(this.helper);

		return super.getParentOffset();
	}

	calculatePosition(event, constraint = true) {
		const { pageX, pageY } = constraint ? this.constraintPosition(event) : event;
		let { scrollParent } = this.helperAttrs;
		const { cssPosition, offsetParent } = this.helperAttrs;
		let scrollIsRoot = isRoot(scrollParent);

		if (cssPosition === 'absolute' && !(scrollParent !== document && contains(scrollParent, offsetParent))) {
			scrollParent = offsetParent;
			scrollIsRoot = isRoot(scrollParent);
		}

		if (cssPosition === 'relative' && scrollParent === document && scrollParent !== offsetParent) {
			this.offset.relative = this.getRelativeOffset();
		}

		this.offset.scroll = {
			left: scrollLeft(scrollParent),
			top: scrollTop(scrollParent)
		};

		const { click, parent, relative, scroll } = this.offset;
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
		let { scrollParent } = this.helperAttrs;
		const { cssPosition, offsetParent } = this.helperAttrs;
		const { parent, relative } = this.offset;
		const factor = to === 'absolute' ? 1 : -1;
		let scrollIsRoot = isRoot(scrollParent);

		if (cssPosition === 'absolute' && !(scrollParent !== document && contains(scrollParent, offsetParent))) {
			scrollParent = offsetParent;
			scrollIsRoot = isRoot(scrollParent);
		}

		return {
			left:
				position.left +
				parent.left * factor +
				relative.left * factor -
				(cssPosition === 'fixed' ? -scrollLeft(scrollParent) : (scrollIsRoot ? 0 : scrollLeft(scrollParent)) * factor),
			top:
				position.top +
				parent.top * factor +
				relative.top * factor -
				(cssPosition === 'fixed' ? -scrollTop(scrollParent) : (scrollIsRoot ? 0 : scrollTop(scrollParent)) * factor)
		};
	}

	getDragDirection(axis) {
		const delta = this.position.absolute[axis === 'x' ? 'left' : 'top'] - this.previousPosition[axis === 'x' ? 'left' : 'top'];

		return delta !== 0 ? (delta > 0 ? (axis === 'x' ? 'right' : 'down') : axis === 'x' ? 'left' : 'up') : null;
	}

	getPointerIntersection(item) {
		const { axis } = this.options;
		const { click } = this.offset;
		const { absolute } = this.position;
		const pointer = {
			x: absolute.left + click.left,
			y: absolute.top + click.top
		};
		const isOverItem =
			(axis === 'y' || (pointer.x >= item.left && pointer.x < item.left + item.width)) &&
			(axis === 'x' || (pointer.y >= item.top && pointer.y < item.top + item.height));

		if (!isOverItem) {
			return 0;
		}

		const dragDirectionX = this.getDragDirection('x');
		const dragDirectionY = this.getDragDirection('y');

		return this.floating ? (dragDirectionX === 'right' || dragDirectionY === 'bottom' ? 2 : 1) : dragDirectionY === 'down' ? 2 : 1;
	}

	intersectsWith(compareWith) {
		const { axis, tolerance } = this.options;
		const { width, height } = this.helperSize;
		const { click } = this.offset;
		const { absolute } = this.position;
		const proportions = {
			left: absolute.left + click.left,
			top: absolute.top + click.top,
			right: absolute.left + click.left + width,
			bottom: absolute.top + click.top + height,
			width,
			height
		};

		if (tolerance === 'pointer' || (this.floating && width > compareWith.width) || (!this.floating && height > compareWith.height)) {
			return (
				(axis === 'y' || (proportions.left > compareWith.left && proportions.left < compareWith.left + compareWith.width)) &&
				(axis === 'x' || (proportions.top > compareWith.top && proportions.top < compareWith.top + compareWith.height))
			);
		}

		return (
			compareWith.left < absolute.left + width / 2 &&
			compareWith.left + compareWith.width > absolute.left + width / 2 &&
			compareWith.top < absolute.top + height / 2 &&
			compareWith.top + compareWith.height > absolute.top + height / 2
		);
	}

	intersectsWithSides(item) {
		const { width, height, left, top } = item;
		const { click } = this.offset;
		const { absolute } = this.position;
		const pointer = {
			x: absolute.left + click.left,
			y: absolute.top + click.top
		};
		const itemCenter = {
			x: left + width / 2,
			y: top + height / 2
		};
		const dragDirectionX = this.getDragDirection('x');
		const dragDirectionY = this.getDragDirection('y');

		if (this.floating && dragDirectionX) {
			return (
				(dragDirectionX === 'right' && pointer.x >= itemCenter.x && pointer.x < itemCenter.x + width) ||
				(dragDirectionX === 'left' && !(pointer.x >= itemCenter.x && pointer.x < itemCenter.x + width))
			);
		}

		return (
			(dragDirectionY === 'down' && pointer.y >= itemCenter.y && pointer.y < itemCenter.y + height) ||
			(dragDirectionY === 'up' && !(pointer.y >= itemCenter.y && pointer.y < itemCenter.y + height))
		);
	}

	contactSortables(event) {
		let activeSortable = null;
		let closestItem = null;
		const changeEvent = new SortableChangeEvent({
			sortable: this
		});

		this.connectedSortables.forEach(sortable => {
			if (!contains(this.currentItem, sortable.element)) {
				if (this.intersectsWith(sortable.elementProportions)) {
					if (!activeSortable || !contains(sortable.element, activeSortable.element)) {
						activeSortable = sortable;
					}
				} else {
					sortable.out(this);
				}
			}
		});

		if (activeSortable) {
			if (this.connectedSortables.length === 1) {
				activeSortable.over(null);
			} else {
				closestItem = this.findClosestItem(event, activeSortable);
				if (closestItem.item || this.options.dropOnEmpty) {
					if (this.currentConnectedSortable === activeSortable) {
						activeSortable.over(this);
					} else {
						if (closestItem.item) {
							this.rearrange(null, closestItem.item, closestItem.nearBottom ? 'up' : 'down');
						} else {
							this.rearrange(activeSortable.element);
						}
						this.trigger(changeEvent);
						activeSortable.over(this);
						activeSortable.trigger(changeEvent);
						this.currentConnectedSortable = activeSortable;
						this.updatePlaceholder(activeSortable, this.placeholder);
					}
				}
			}
		}
	}

	rearrange(parentEl = null, refItem = null, direction = null) {
		if (parentEl instanceof HTMLElement) {
			parentEl.appendChild(this.placeholder);
		} else if (refItem && refItem.element instanceof HTMLElement) {
			refItem.element.parentNode.insertBefore(this.placeholder, direction === 'down' ? refItem.element : refItem.element.nextSibling);
		} else {
			return;
		}

		this.rearrangeIteration = this.rearrangeIteration ? this.rearrangeIteration++ : 1;
		const iteration = this.rearrangeIteration;

		setTimeout(() => {
			if (iteration === this.rearrangeIteration) {
				this.refreshPositions();
			}
		});
	}

	applyChanges() {
		let newIndex = null;

		if (this.helper && this.currentItem) {
			insertBefore(this.currentItem, this.placeholder);
			newIndex = getChildIndex(this.currentItem);
			if (this.helper === this.currentItem) {
				forEach(this.currentItemStyle, (value, prop) => {
					if (value === 'auto' || value === 'static') {
						this.currentItemStyle[prop] = '';
					}
				});
				style(this.currentItem, this.currentItemStyle);
			} else {
				show(this.currentItem);
			}
			if (this.resetCurrentItem) {
				const { previous, parent } = this.currentItemProps;

				if (previous) {
					insertAfter(this.currentItem, previous);
				} else {
					insertBefore(this.currentItem, parent.firstElementChild);
				}
				this.resetCurrentItem = false;
			}
		}
		if (this.connectedDraggable) {
			this.trigger(
				new SortableReceiveEvent({
					sortable: this,
					item: this.connectedDraggable.element,
					newIndex,
					draggable: this.connectedDraggable
				})
			);
		}
		if (
			this.connectedDraggable ||
			this.currentItemProps.previous !== getSibling(this.currentItem, 'previous', `.${this.helperClass}`) ||
			this.currentItemProps.parent !== this.currentItem.parentNode
		) {
			this.trigger(
				new SortableUpdateEvent({
					sortable: this,
					item: this.currentItem,
					previousIndex: this.currentItemProps.previousIndex,
					newIndex,
					peerSortable: this.currentConnectedSortable !== this ? this.currentConnectedSortable : null
				})
			);
		}
		if (this.currentConnectedSortable !== this) {
			this.trigger(
				new SortableRemoveEvent({
					sortable: this,
					item: this.currentItem,
					previousIndex: this.currentItemProps.previousIndex,
					peerSortable: this.currentConnectedSortable
				})
			);
			this.currentConnectedSortable.trigger(
				new SortableReceiveEvent({
					sortable: this.currentConnectedSortable,
					item: this.currentItem,
					newIndex,
					peerSortable: this
				})
			);
			this.currentConnectedSortable.trigger(
				new SortableUpdateEvent({
					sortable: this.currentConnectedSortable,
					peerSortable: this,
					previousIndex: this.currentItemProps.previousIndex,
					newIndex
				})
			);
		}
		this.connectedSortables.forEach(sortable => {
			sortable.out(this);
			sortable.trigger(
				new SortableDeactivateEvent({
					sortable,
					peerSortable: this
				})
			);
		});
	}

	clear() {
		if (this.placeholder) {
			if (this.placeholder.parentNode) {
				this.placeholder.parentNode.removeChild(this.placeholder);
			}
			this.placeholder = null;
		}
		if (this.helper) {
			removeClass(this.helper, this.helperClass);
			if (this.helper !== this.currentItem && !this.cancelHelperRemoval) {
				this.helper.parentNode.removeChild(this.helper);
			}
			this.cancelHelperRemoval = false;
			this.helper = null;
		}
		this.connectedDraggable = null;
		this.currentItem = null;
		this.currentItemProps = null;
		this.dragging = false;
		if (this.pendingDestroy) {
			this.destroy();
			this.pendingDestroy = false;
		}
	}
}
