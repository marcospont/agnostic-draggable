import { getPaddingAndBorder } from '../util';
import Plugin from './plugin';

export default class ResizeGridConstraint extends Plugin {
	constructor(container) {
		super(container);
		this.attach();
	}

	get supported() {
		return this.isResizable();
	}

	get grid() {
		const { options } = this.container;

		return Array.isArray(options.grid) && options.grid.length === 2 ? options.grid : null;
	}

	onDragMove = sensorEvent => {
		if (this.grid) {
			const [x, y] = this.grid;
			const { size, position } = sensorEvent;
			const { currentDirection, helper } = this.container;
			const { size: originalSize, position: originalPosition } = this.container.originalAttrs;
			const { minWidth, maxWidth, minHeight, maxHeight } = this.container.options;
			const delta = {
				x: originalSize.width + Math.round((size.width - originalSize.width) / x) * x,
				y: originalSize.height + Math.round((size.height - originalSize.height) / y) * y
			};
			const newSize = {
				width: delta.x,
				height: delta.y
			};

			if (minWidth && minWidth > newSize.width) {
				newSize.width += x;
			}
			if (maxWidth && maxWidth < newSize.width) {
				newSize.width -= x;
			}
			if (minHeight && minHeight > newSize.height) {
				newSize.height += y;
			}
			if (maxHeight && maxHeight < newSize.height) {
				newSize.height -= y;
			}

			if (/^(se|s|e)$/.test(currentDirection)) {
				size.width = newSize.width;
				size.height = newSize.height;
			} else if (/^(ne)$/.test(currentDirection)) {
				size.width = newSize.width;
				size.height = newSize.height;
				position.top = originalPosition.top - delta.y;
			} else if (/^(sw)$/.test(currentDirection)) {
				size.width = newSize.width;
				size.height = newSize.height;
				position.left = originalPosition.left - delta.x;
			} else {
				const dimensions = getPaddingAndBorder(helper);

				if (newSize.width - x > 0) {
					size.width = newSize.width;
					position.left = originalPosition.left - delta.x;
				} else {
					size.width = x - dimensions.width;
					position.left = originalPosition.left + originalSize.width - newSize.width;
				}
				if (newSize.height - y > 0) {
					size.height = newSize.height;
					position.top = originalPosition.top - delta.y;
				} else {
					size.height = y - dimensions.height;
					position.top = originalPosition.top + originalSize.height - newSize.height;
				}
			}
		}
	};
}
