import { addClass, style } from 'dom-helpers';
import Plugin from './plugin';

export default class ResizeGhost extends Plugin {
	ghost = null;

	constructor(container) {
		super(container);
		this.attach();
	}

	get supported() {
		return this.isResizable();
	}

	onDragStart = sensorEvent => {
		const { ghost } = this.container.options;

		if (ghost) {
			const { originalElement } = this.container;
			const { size } = this.container.currentAttrs;

			this.ghost = originalElement.cloneNode(true);
			style(this.ghost, {
				display: 'block',
				position: 'relative',
				width: `${size.width}px`,
				height: `${size.height}px`,
				top: '0px',
				left: '0px',
				margin: '0px',
				opacity: 0.25
			});
			addClass(this.ghost, this.container.ghostClass);
			this.container.helper.appendChild(this.ghost);
		}
	};

	onDragMove = sensorEvent => {
		if (this.ghost) {
			const { size } = this.container.currentAttrs;

			style(this.ghost, {
				width: `${size.width}px`,
				height: `${size.height}px`
			});
		}
	};

	onDragStop = sensorEvent => {
		if (this.ghost) {
			this.container.helper.removeChild(this.ghost);
			this.ghost = null;
		}
	};
}
