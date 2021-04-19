import { querySelectorAll, style } from 'dom-helpers';

import Plugin from './plugin';
import { SortableActivateEvent, SortableDeactivateEvent } from '../sortable/sortable-event';
import { sortableProp } from '../util/constants';
import { contains, styleAsNumber } from '../util';

export default class ConnectToSortable extends Plugin {
	constructor(draggable) {
		super(draggable);
		this.attach();
	}

	get connectToSortable() {
		const { connectToSortable } = this.draggable.options;

		return connectToSortable || null;
	}

	onDragStart = event => {
		if (this.connectToSortable) {
			this.draggable.connectedSortables = [];

			querySelectorAll(document, this.connectToSortable).forEach(element => {
				const sortable = element[sortableProp];

				if (sortable && !sortable.disabled) {
					this.draggable.connectedSortables.push(sortable);
					sortable.refreshPositions();
					sortable.trigger(
						new SortableActivateEvent({
							sortable,
							sensorEvent: event.sensorEvent,
							draggable: this.draggable
						})
					);
				}
			});
		}
	};

	onDragMove = event => {
		const { sensorEvent } = event;

		if (this.connectToSortable) {
			this.draggable.connectedSortables.forEach(sortable => {
				let intersecting = false;
				const { helperSize, position } = this.draggable;
				const { click, parent } = this.draggable.offset;

				sortable.helperSize = helperSize;
				sortable.offset.click = click;
				sortable.position.absolute = position.absolute;
				if (sortable.intersectsWith(sortable.elementProportions)) {
					intersecting = true;
					this.draggable.connectedSortables.forEach(innerSortable => {
						innerSortable.helperSize = helperSize;
						innerSortable.offset.click = click;
						innerSortable.position.absolute = position.absolute;
						if (
							innerSortable !== sortable &&
							innerSortable.intersectsWith(innerSortable.elementProportions) &&
							contains(sortable.element, innerSortable.element)
						) {
							intersecting = false;
						}
					});
				}

				if (intersecting) {
					if (!sortable.isDraggableOver) {
						if (!this.draggable.previousHelperParent) {
							this.draggable.previousHelperParent = this.draggable.helper.parentNode;
						}
						this.draggable.helper[sortableProp] = sortable;
						sortable.element.appendChild(this.draggable.helper);
						sortable.previousHelper = sortable.options.helper;
						sortable.options.helper = () => this.draggable.helper;
						sortable.currentItem = this.draggable.helper;
						sortable.connectedDraggable = this.draggable;
						sensorEvent.target = sortable.currentItem;
						sortable.over(null, this.draggable);
						sortable.isDraggableOver = true;
						sortable.onDragStart(
							{
								detail: sensorEvent
							},
							true,
							true
						);
						sortable.offset.click = click;
						sortable.offset.parent.left -= parent.left - sortable.offset.parent.left;
						sortable.offset.parent.top -= parent.top - sortable.offset.parent.top;
						this.draggable.connectedSortables.forEach(sortable => sortable.refreshPositions());
					}
					if (sortable.currentItem) {
						sortable.onDragMove(
							{
								detail: sensorEvent
							},
							false,
							true
						);
						event.position = sortable.position.current;
					}
				} else if (!intersecting && sortable.isDraggableOver) {
					sortable.previousRevert = sortable.options.revert;
					sortable.options.revert = false;
					sortable.out(null, this.draggable);
					sortable.isDraggableOver = false;
					sortable.cancelHelperRemoval = sortable.helper === sortable.currentItem;
					if (sortable.placeholder) {
						sortable.placeholder.parentNode.removeChild(sortable.placeholder);
					}
					sortable.onDragStop(
						{
							detail: sensorEvent
						},
						true
					);
					sortable.options.helper = sortable.previousHelper;
					sortable.previousHelper = null;
					sortable.options.revert = sortable.previousRevert;
					sortable.previousRevert = null;
					this.draggable.previousHelperParent.appendChild(this.draggable.helper);
					this.draggable.helper[sortableProp] = null;
					this.draggable.calculateOffsets(sensorEvent);
					this.draggable.calculatePosition(sensorEvent);
					this.draggable.connectedSortables.forEach(sortable => sortable.refreshPositions());
					event.position = this.draggable.position.current;
				}
			});
		}
	};

	onDragStop = event => {
		const { sensorEvent } = event;

		if (this.connectToSortable) {
			this.draggable.cancelHelperRemoval = false;
			this.draggable.connectedSortables.forEach(sortable => {
				if (sortable.isDraggableOver) {
					delete this.draggable.helper[sortableProp];
					this.draggable.cancelHelperRemoval = true;
					sortable.cancelHelperRemoval = false;
					sortable.options.helper = sortable.previousHelper;
					sortable.previousHelper = null;
					sortable.previousRevert = sortable.options.revert;
					sortable.options.revert = false;
					event.droppedSortable = sortable;
					sortable.out(null, this.draggable);
					sortable.isDraggableOver = false;
					sortable.currentItemStyle = {
						position: style(sortable.placeholder, 'position'),
						left: styleAsNumber(sortable.placeholder, 'left'),
						top: styleAsNumber(sortable.placeholder, 'top')
					};
					sortable.onDragStop(
						{
							detail: sensorEvent
						},
						true
					);
					sortable.options.revert = sortable.previousRevert;
					sortable.previousRevert = null;
					sortable.currentItem = null;
					sortable.connectedDraggable = null;
					this.draggable.helper[sortableProp] = null;
					this.draggable.connectedSortables.forEach(sortable => sortable.refreshPositions());
				} else {
					sortable.cancelHelperRemoval = false;
				}
				sortable.trigger(
					new SortableDeactivateEvent({
						sortable,
						sensorEvent,
						draggable: this.draggable
					})
				);
				sortable.currentItem = null;
				sortable.connectedDraggable = null;
			});
			this.draggable.connectedSortables = [];
		}
	};
}
