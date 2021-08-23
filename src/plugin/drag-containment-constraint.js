import { height, offset, style, width } from 'dom-helpers';
import Plugin from './plugin';
import { styleAsNumber } from '../util';

export default class DragContainmentConstraint extends Plugin {
	constructor(container) {
		super(container);
		this.attach();
	}

	get supported() {
		return this.isDraggable() || this.isSortable();
	}

	get containment() {
		if (this.container.containmentCoords === undefined) {
			const { containment } = this.container.options;
			const { parent, relative } = this.container.offset;
			const { helper, helperSize, margins } = this.container;

			if (containment === 'window') {
				this.container.containmentCoords = [
					window.pageXOffset - parent.left - relative.left,
					window.pageYOffset - parent.top - relative.top,
					window.pageXOffset + window.innerWidth - helperSize.width - margins.left,
					window.pageYOffset + window.innerHeight - helperSize.height - margins.top
				];
			} else if (containment === 'document') {
				this.container.containmentCoords = [
					0,
					0,
					width(document) - helperSize.width - margins.left,
					height(document) - helperSize.height - margins.top
				];
			} else if (Array.isArray(containment) && containment.length === 4) {
				this.container.containmentCoords = containment;
			} else {
				const node = containment === 'parent' ? helper.parentNode : document.querySelector(containment);

				if (node) {
					const scrollable = /(scroll|auto)/.test(style(node, 'overflow'));

					this.container.containmentContainer = node;
					this.container.containmentCoords = [
						styleAsNumber(node, 'borderLeftWidth') + styleAsNumber(node, 'paddingLeft'),
						styleAsNumber(node, 'borderTopWidth') + styleAsNumber(node, 'paddingTop'),
						(scrollable ? Math.max(node.scrollWidth, node.offsetWidth) : node.offsetWidth) -
							styleAsNumber(node, 'borderRightWidth') -
							styleAsNumber(node, 'paddingRight') -
							helperSize.width -
							margins.left -
							margins.right,
						(scrollable ? Math.max(node.scrollHeight, node.offsetHeight) : node.offsetHeight) -
							styleAsNumber(node, 'borderBottomWidth') -
							styleAsNumber(node, 'paddingBottom') -
							helperSize.height -
							margins.top -
							margins.bottom
					];
				} else {
					this.container.containmentCoords = null;
				}
			}
		}

		return this.container.containmentCoords;
	}

	constraintPosition = pos => {
		if (this.containment) {
			let [xMin, yMin, xMax, yMax] = this.containment;
			const { containmentContainer } = this.container;
			const { click } = this.container.offset;

			if (containmentContainer) {
				const containerOffset = offset(containmentContainer);

				xMin += containerOffset.left;
				yMin += containerOffset.top;
				xMax += containerOffset.left;
				yMax += containerOffset.top;
			}

			if (pos.pageX - click.left < xMin) {
				pos.pageX = xMin + click.left;
			}
			if (pos.pageY - click.top < yMin) {
				pos.pageY = yMin + click.top;
			}
			if (pos.pageX - click.left > xMax) {
				pos.pageX = xMax + click.left;
			}
			if (pos.pageY - click.top > yMax) {
				pos.pageY = yMax + click.top;
			}
		}

		return pos;
	};
}
