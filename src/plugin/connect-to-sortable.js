import { querySelectorAll, style } from 'dom-helpers';
import Plugin from './plugin';
import { SortableActivateEvent, SortableDeactivateEvent } from '../sortable/sortable-event';
import { sortableProp } from '../util/constants';
import { contains, styleAsNumber } from '../util';

export default class ConnectToSortable extends Plugin {
	constructor(container) {
		super(container);
		this.attach();
	}

	get supported() {
		return this.isSortable();
	}

	get connectToSortable() {
		const { connectToSortable } = this.container.options;

		return connectToSortable || null;
	}

	onDragStart = event => {
		if (this.connectToSortable) {
			this.container.connectedSortables = [];

			querySelectorAll(document, this.connectToSortable).forEach(element => {
				const sortable = element[sortableProp];

				if (sortable && !sortable.disabled) {
					this.container.connectedSortables.push(sortable);
					sortable.refreshPositions();
					sortable.trigger(
						new SortableActivateEvent({
							sortable,
							sensorEvent: event.sensorEvent,
							draggable: this.container
						})
					);
				}
			});
		}
	};

	onDragMove = event => {
		const { sensorEvent } = event;

		if (this.connectToSortable) {
			this.container.connectedSortables.forEach(sortable => {
				let intersecting = false;
				const { helperSize, position } = this.container;
				const { click, parent } = this.container.offset;

				sortable.helperSize = helperSize;
				sortable.offset.click = click;
				sortable.position.absolute = position.absolute;
				if (sortable.intersectsWith(sortable.elementProportions)) {
					intersecting = true;
					this.container.connectedSortables.forEach(innerSortable => {
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
						if (!this.container.previousHelperParent) {
							this.container.previousHelperParent = this.container.helper.parentNode;
						}
						this.container.helper[sortableProp] = sortable;
						sortable.element.appendChild(this.container.helper);
						sortable.previousHelper = sortable.options.helper;
						sortable.options.helper = () => this.container.helper;
						sortable.currentItem = this.container.helper;
						sortable.connectedDraggable = this.container;
						sensorEvent.target = sortable.currentItem;
						sortable.over(null, this.container);
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
						this.container.connectedSortables.forEach(sortable => sortable.refreshPositions());
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
					sortable.out(null, this.container);
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
					this.container.previousHelperParent.appendChild(this.container.helper);
					this.container.helper[sortableProp] = null;
					this.container.calculateOffsets(sensorEvent);
					this.container.calculatePosition(sensorEvent);
					this.container.connectedSortables.forEach(sortable => sortable.refreshPositions());
					event.position = this.container.position.current;
				}
			});
		}
	};

	onDragStop = event => {
		const { sensorEvent } = event;

		if (this.connectToSortable) {
			this.container.cancelHelperRemoval = false;
			this.container.connectedSortables.forEach(sortable => {
				if (sortable.isDraggableOver) {
					delete this.container.helper[sortableProp];
					this.container.cancelHelperRemoval = true;
					sortable.cancelHelperRemoval = false;
					sortable.options.helper = sortable.previousHelper;
					sortable.previousHelper = null;
					sortable.previousRevert = sortable.options.revert;
					sortable.options.revert = false;
					event.droppedSortable = sortable;
					sortable.out(null, this.container);
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
					this.container.helper[sortableProp] = null;
					this.container.connectedSortables.forEach(sortable => sortable.refreshPositions());
				} else {
					sortable.cancelHelperRemoval = false;
				}
				sortable.trigger(
					new SortableDeactivateEvent({
						sortable,
						sensorEvent,
						draggable: this.container
					})
				);
				sortable.currentItem = null;
				sortable.connectedDraggable = null;
			});
			this.container.connectedSortables = [];
		}
	};
}
