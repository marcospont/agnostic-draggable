import { offset, scrollLeft, scrollTop } from 'dom-helpers';
import DragDropManager from '../manager';
import Plugin from './plugin';
import { isRoot } from '../util';

export default class AutoScroll extends Plugin {
	scrollParent = null;

	scrollParentOffset = null;

	constructor(container) {
		super(container);
		this.attach();
	}

	get supported() {
		return this.isDraggable() || this.isSortable();
	}

	get scroll() {
		const { options } = this.container;

		return options.scroll;
	}

	onDragStart = event => {
		if (!this.scroll) {
			return;
		}

		const { helperAttrs } = this.container;

		if (!this.scrollParent) {
			this.scrollParent = helperAttrs.scrollParent;
		}
		if (!isRoot(this.scrollParent, false)) {
			this.scrollParentOffset = offset(this.scrollParent);
		}
	};

	onDragMove = event => {
		if (!this.scroll) {
			return;
		}

		let scrolled = false;
		const { sensorEvent } = event;
		const { scrollParent, scrollParentOffset } = this;
		const { helperSize } = this.container;
		const { click } = this.container.offset;
		const { axis, scrollSensitivity, scrollSpeed } = this.container.options;
		const pos = {
			x: sensorEvent.pageX - click.left - (isRoot(this.scrollParent, false) ? scrollLeft(document) : 0),
			y: sensorEvent.pageY - click.top - (isRoot(this.scrollParent, false) ? scrollTop(document) : 0)
		};

		if (!isRoot(this.scrollParent, false)) {
			if (!axis || axis !== 'y') {
				if (scrollParentOffset.left + scrollParent.offsetWidth - (pos.x + helperSize.width) < scrollSensitivity) {
					scrollParent.scrollLeft = scrollParent.scrollLeft + scrollSpeed;
					scrolled = true;
				} else if (pos.x - scrollParentOffset.left < scrollSensitivity) {
					scrollParent.scrollLeft = scrollParent.scrollLeft - scrollSpeed;
					scrolled = true;
				}
			}
			if (!axis || axis !== 'x') {
				if (scrollParentOffset.top + scrollParent.offsetHeight - (pos.y + helperSize.height) < scrollSensitivity) {
					scrollParent.scrollTop = scrollParent.scrollTop + scrollSpeed;
					scrolled = true;
				} else if (pos.y - scrollParentOffset.top < scrollSensitivity) {
					scrollParent.scrollTop = scrollParent.scrollTop - scrollSpeed;
					scrolled = true;
				}
			}
		} else {
			if (!axis || axis !== 'y') {
				if (pos.x < scrollSensitivity) {
					scrollLeft(document, scrollLeft(document) - scrollSpeed);
					scrolled = true;
				} else if (window.innerWidth - (pos.x + helperSize.width) < scrollSensitivity) {
					scrollLeft(document, scrollLeft(document) + scrollSpeed);
					scrolled = true;
				}
			}
			if (!axis || axis !== 'x') {
				if (pos.y < scrollSensitivity) {
					scrollTop(document, scrollTop(document) - scrollSpeed);
					scrolled = true;
				} else if (window.innerHeight - (pos.y + helperSize.height) < scrollSensitivity) {
					scrollTop(document, scrollTop(document) + scrollSpeed);
					scrolled = true;
				}
			}
		}
		if (scrolled) {
			DragDropManager.prepareOffsets(this.container, sensorEvent);
		}
	};
}
