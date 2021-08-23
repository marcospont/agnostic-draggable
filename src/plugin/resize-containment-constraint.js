import { width, height, offset, position, style } from 'dom-helpers';
import { styleAsNumber } from '../util';
import Plugin from './plugin';

export default class ResizeContainmentConstraint extends Plugin {
	containmentContainer = null;

	containmentAttrs = {
		offset: null,
		position: null,
		size: null
	};

	constructor(container) {
		super(container);
		this.attach();
	}

	get supported() {
		return this.isResizable();
	}

	onDragStart = sensorEvent => {
		const { helper } = this.container;
		const { containment } = this.container.options;

		if (containment === 'document') {
			this.containmentContainer = document;
			this.containmentAttrs.offset = {
				left: 0,
				top: 0
			};
			this.containmentAttrs.position = {
				left: 0,
				top: 0
			};
			this.containmentAttrs.size = {
				width: width(document),
				height: height(document) || document.body.parentNode.scrollHeight
			};
		} else {
			const paddings = [];
			const node = containment === 'parent' ? helper.parentNode : document.querySelector(containment);

			if (node) {
				this.containmentContainer = node;
				['Top', 'Right', 'Bottom', 'Left'].forEach(side => {
					paddings[side.toLowerCase()] = styleAsNumber(node, `padding${side}`);
				});
				this.containmentAttrs.offset = offset(node);
				this.containmentAttrs.position = position(node);
				this.containmentAttrs.size = {
					width: width(node) - paddings.left - paddings.right,
					height: height(node) - paddings.top - paddings.bottom
				};
			}
		}
	};

	onDragMove = sensorEvent => {
		let { helper: helperOffset } = this.container.offset;
		let containmentPosition = {
			left: 0,
			top: 0
		};
		const { size, position } = sensorEvent;
		const { aspectRatio, helper } = this.container;
		const { containment } = this.container.options;
		const { size: currentSize, position: currentPosition } = this.container.currentAttrs;
		const { containmentContainer } = this;
		const { size: containmentSize, offset: containmentOffset } = this.containmentAttrs;

		if (!containmentContainer) {
			return;
		}

		if (containmentContainer !== document && style(containmentContainer, 'position') === 'static') {
			containmentPosition = containmentOffset;
		}

		// console.log(currentSize);
		// console.log(currentPosition);

		if (currentPosition.left < 0) {
			size.width += currentPosition.left;
			if (aspectRatio) {
				size.height = size.width / aspectRatio;
			}
			position.left = 0;
		}
		if (currentPosition.top < 0) {
			size.height += currentPosition.top;
			if (aspectRatio) {
				size.width = size.height * aspectRatio;
			}
			position.top = 0;
		}
		if (containment === 'parent' && /absolute|relative/.test(style(containmentContainer, 'position'))) {
			helperOffset.left = containmentPosition.left + currentPosition.left;
			helperOffset.top = containmentPosition.top + currentPosition.top;
		} else {
			helperOffset = offset(helper);
		}
		if (currentSize.width + (helperOffset.left - containmentPosition.left) >= containmentSize.width) {
			size.width = containmentSize.width - (helperOffset.left - containmentPosition.left);
			if (aspectRatio) {
				size.height = currentSize.width / aspectRatio;
			}
		}
		if (currentSize.height + (helperOffset.top - containmentPosition.top) >= containmentSize.height) {
			size.height = containmentSize.height - (helperOffset.top - containmentPosition.top);
			if (aspectRatio) {
				size.width = currentSize.height * aspectRatio;
			}
		}
	};
}
