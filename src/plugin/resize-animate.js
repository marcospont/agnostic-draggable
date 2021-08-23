import anime from 'animejs/lib/anime.es';
import { width, height } from 'dom-helpers';
import { styleAsNumber } from '../util';
import Plugin from './plugin';

export default class ResizeAnimate extends Plugin {
	constructor(container) {
		super(container);
		this.attach();
	}

	get supported() {
		return this.isResizable();
	}

	onDragStop = sensorEvent => {
		const { animate, animateDuration } = this.container.options;

		if (animate) {
			const styleProps = {};
			const { element, helper } = this.container;
			const { position: originalPosition } = this.container.originalAttrs;
			const { position } = this.container.currentAttrs;

			styleProps.width = `${width(helper)}px`;
			styleProps.height = `${height(helper)}px`;
			styleProps.top = `${styleAsNumber(element, 'top') + (position.top - originalPosition.top)}px`;
			styleProps.left = `${styleAsNumber(element, 'left') + (position.left - originalPosition.left)}px`;
			anime({
				...styleProps,
				...{
					targets: [element],
					duration: animateDuration,
					easing: 'linear',
					update: () => {
						this.container.currentAttrs.size = {
							width: width(element),
							height: height(element)
						};
						this.container.currentAttrs.position = {
							left: styleAsNumber(element, 'left'),
							top: styleAsNumber(element, 'top')
						};
						this.container.updateResizableElements(this.container.currentAttrs.size);
					}
				}
			});
		}
	};
}
