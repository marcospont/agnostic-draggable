import { height, offset, style, width } from 'dom-helpers';

import Plugin from './plugin';
import { styleAsNumber } from '../util';

export default class ContainmentConstraint extends Plugin {
	constructor(draggable) {
		super(draggable);
		this.attach();
	}

	get containment() {
		if (this.draggable.containmentCoords === undefined) {
			const { containment } = this.draggable.options;
			const { parent, relative } = this.draggable.offset;
			const { helper, helperSize, margins } = this.draggable;

			if (containment === 'window') {
				this.draggable.containmentCoords = [
					window.pageXOffset - parent.left - relative.left,
					window.pageYOffset - parent.top - relative.top,
					window.pageXOffset + window.innerWidth - helperSize.width - margins.left,
					window.pageYOffset + window.innerHeight - helperSize.height - margins.top
				];
			} else if (containment === 'document') {
				this.draggable.containmentCoords = [
					0,
					0,
					width(document) - helperSize.width - margins.left,
					height(document) - helperSize.height - margins.top
				];
			} else if (Array.isArray(containment) && containment.length === 4) {
				this.draggable.containmentCoords = containment;
			} else {
				const node = containment === 'parent' ? helper.parentNode : document.querySelector(containment);

				if (node) {
					const scrollable = /(scroll|auto)/.test(style(node, 'overflow'));

					this.draggable.containmentContainer = node;
					this.draggable.containmentCoords = [
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
					this.draggable.containmentCoords = null;
				}
			}
		}

		return this.draggable.containmentCoords;
	}

	constraintPosition = pos => {
		if (this.containment) {
			let [xMin, yMin, xMax, yMax] = this.containment;
			const { containmentContainer } = this.draggable;
			const { click } = this.draggable.offset;

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
