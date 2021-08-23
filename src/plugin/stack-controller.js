import { querySelectorAll, style } from 'dom-helpers';
import Plugin from './plugin';
import { styleAsNumber } from '../util';

export default class StackController extends Plugin {
	constructor(container) {
		super(container);
		this.attach();
	}

	get supported() {
		return this.isDraggable();
	}

	get stack() {
		const { options } = this.container;

		return options.stack ? querySelectorAll(document, options.stack) : [];
	}

	onDragStart = event => {
		if (this.stack.length > 0) {
			const { helper } = this.container;
			const sorted = this.stack.sort((a, b) => styleAsNumber(a, 'zIndex') - styleAsNumber(b, 'zIndex'));
			const min = styleAsNumber(sorted[0], 'zIndex');

			sorted.forEach((element, idx) => {
				style(element, {
					zIndex: min + idx
				});
			});
			style(helper, {
				zIndex: min + sorted.length
			});
		}
	};
}
