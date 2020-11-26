import { querySelectorAll, style } from 'dom-helpers';

import Plugin from './plugin';
import { styleAsNumber } from '../util';

export default class StackController extends Plugin {
	constructor(draggable) {
		super(draggable);
		this.attach();
	}

	get stack() {
		const { options } = this.draggable;

		return options.stack ? querySelectorAll(document, options.stack) : [];
	}

	onDragStart = event => {
		if (this.stack.length > 0) {
			const { helper } = this.draggable;
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
