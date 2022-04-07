import { addClass, width, height, listen, offset, remove, removeClass, style, isInput } from 'dom-helpers';
import isFinite from 'lodash/isFinite';
import isString from 'lodash/isString';
import Draggable from '../draggable/draggable';
import { ResizableInitEvent, ResizableDestroyEvent } from './resizable-event';
import { ResizeStartEvent, ResizeChangeEvent, ResizeStopEvent } from './resize-event';
import resizeTransforms from './resize-transforms';
import { ResizeGridConstraint, ResizeContainmentConstraint, ResizeAnimate, ResizeGhost } from '../plugin';
import { MouseSensor } from '../sensor';
import {
	createElement,
	createMouseStopEvent,
	disableSelection,
	hide,
	insertAfter,
	show,
	injectStyles,
	styleAsNumber,
	getPaddingAndBorder
} from '../util';
import {
	resizableProp,
	resizableEl,
	resizableWrapper,
	resizableAutoHide,
	resizableHandle,
	resizableHandleProp,
	resizableHelper,
	resizableResizing,
	resizableGhost,
	resizableDirections,
	resizableDirectionStyles
} from '../util/constants';

const wrappableElements = /^(canvas|textarea|input|select|button|img)$/i;

export default class Resizable extends Draggable {
	static defaultOptions = {
		alsoResize: null,
		animate: false,
		animateDuration: 500,
		aspectRatio: false,
		autoHide: false,
		containment: null,
		disabled: false,
		distance: 0,
		flex: false,
		ghost: false,
		grid: null,
		handles: 'e,s,se',
		maxHeight: null,
		maxWidth: null,
		minHeight: null,
		minWidth: null,
		zIndex: 1
	};

	static injectedStyles = {};

	originalElement = null;

	originalResize = null;

	pressing = false;

	resizing = false;

	wrapped = false;

	currentHandle = null;

	currentDirection = null;

	handleDirections = [];

	handleElements = [];

	helper = null;

	offset = {
		click: null,
		helper: null
	};

	originalAttrs = {};

	currentAttrs = {};

	previousAttrs = {};

	aspectRatio = null;

	resizableElements = [];

	listeners = [];

	cancel() {
		if (this.resizing) {
			this.onDragCancel(createMouseStopEvent(this.helper));
		} else {
			this.clear();
		}
	}

	destroy() {
		if (this.resizing) {
			this.pendingDestroy = true;
			return;
		}

		this.plugins.forEach(plugin => plugin.detach());
		this.sensors.forEach(sensor => sensor.detach());
		document.removeEventListener('mouse:start', this.onDragStart);
		document.removeEventListener('mouse:move', this.onDragMove);
		document.removeEventListener('mouse:stop', this.onDragStop);

		removeClass(this.element, this.elementClass);
		if (this.wrapped) {
			this.destroyWrapper();
		} else {
			delete this.element[this.dataProperty];
		}
		if (this.originalElement && this.originalResize) {
			style(this.originalElement, {
				resize: this.originalResize
			});
		}

		this.destroyHandles();
		this.listeners.forEach(listener => listener());

		this.trigger(
			new ResizableDestroyEvent({
				sortable: this
			})
		);
	}

	get dataProperty() {
		return resizableProp;
	}

	get elementClass() {
		return resizableEl;
	}

	get wrapperClass() {
		return resizableWrapper;
	}

	get autoHideClass() {
		return resizableAutoHide;
	}

	get handleClass() {
		return resizableHandle;
	}

	get handleDirectionProperty() {
		return resizableHandleProp;
	}

	get helperClass() {
		return resizableHelper;
	}

	get resizingClass() {
		return resizableResizing;
	}

	get ghostClass() {
		return resizableGhost;
	}

	setup = () => {
		const { autoHide } = this.options;

		this.addPlugin(new ResizeGridConstraint(this));
		this.addPlugin(new ResizeContainmentConstraint(this));
		this.addPlugin(new ResizeAnimate(this));
		this.addPlugin(new ResizeGhost(this));
		this.addSensor(new MouseSensor(this));
		document.addEventListener('mouse:down', this.onMouseDown);
		document.addEventListener('mouse:stop', () => {
			this.pressing = false;
		});
		document.addEventListener('mouse:start', this.onDragStart);
		document.addEventListener('mouse:move', this.onDragMove);
		document.addEventListener('mouse:stop', this.onDragStop);

		this.originalElement = this.element;
		addClass(this.element, this.elementClass);
		style(this.element, {
			position: 'relative'
		});

		if (this.element.nodeName.match(wrappableElements)) {
			this.createWrapper();
		} else {
			this.element[this.dataProperty] = this;
		}

		this.createHandles();

		if (autoHide) {
			addClass(this.element, this.autoHideClass);
			this.listeners.push(
				listen(this.element, 'mouseenter', () => {
					if (!this.disabled) {
						removeClass(this.element, this.autoHideClass);
						this.handleElements.forEach(h => show(h));
					}
				})
			);
			this.listeners.push(
				listen(this.element, 'mouseleave', () => {
					if (!this.disabled && !this.resizing) {
						addClass(this.element, this.autoHideClass);
						this.handleElements.forEach(h => hide(h));
					}
				})
			);
		}

		this.trigger(
			new ResizableInitEvent({
				resizable: this
			})
		);
	};

	onMouseDown = event => {
		const sensorEvent = event.detail;

		if (sensorEvent.caller !== this || !this.currentHandle || !this.currentDirection) {
			return;
		}
		if (this.disabled) {
			sensorEvent.cancel();
			return;
		}
		if (!this.isInsideHandle(sensorEvent)) {
			sensorEvent.cancel();
			return;
		}
		this.pressing = true;
	};

	onDragStart = event => {
		let handleCursor = null;
		const { aspectRatio } = this.options;
		const sensorEvent = event.detail;

		if (sensorEvent.caller !== this || !this.currentHandle || !this.currentDirection) {
			return;
		}

		this.resizing = true;
		this.helper = this.createHelper(sensorEvent);
		this.offset.click = {
			left: sensorEvent.pageX,
			top: sensorEvent.pageY
		};
		this.offset.helper = offset(this.helper);
		this.initializeResize();
		this.aspectRatio = isFinite(aspectRatio) ? aspectRatio : null;

		const resizeStart = new ResizeStartEvent({
			source: this.element,
			helper: this.helper,
			originalElement: this.originalElement,
			originalSize: this.originalAttrs.size,
			originalPosition: this.originalAttrs.position,
			size: this.currentAttrs.size,
			position: this.currentAttrs.position,
			sensorEvent,
			originalEvent: sensorEvent.originalEvent
		});

		this.trigger(resizeStart);
		if (resizeStart.canceled) {
			this.onDragCancel(createMouseStopEvent(this.helper));
			return;
		}

		addClass(this.helper, this.resizingClass);
		handleCursor = style(this.currentHandle, 'cursor');
		style(document.body, {
			cursor: !handleCursor || handleCursor === 'auto' ? `${this.elementClass}-${this.currentDirection}` : handleCursor
		});
	};

	onDragCancel = event => {
		this.sensors.forEach(sensor => sensor.cancel(event));
		this.clear();
	};

	onDragMove = event => {
		const sensorEvent = event.detail;

		if (sensorEvent.caller !== this || !this.currentHandle || !this.currentDirection) {
			return;
		}

		this.previousAttrs = {
			size: { ...this.currentAttrs.size },
			position: { ...this.currentAttrs.position }
		};
		this.calculateResize(sensorEvent);

		const resizeChange = new ResizeChangeEvent({
			element: this.element,
			helper: this.helper,
			originalElement: this.originalElement,
			originalSize: this.originalAttrs.size,
			originalPosition: this.originalAttrs.position,
			size: this.currentAttrs.size,
			position: this.currentAttrs.position,
			sensorEvent,
			originalEvent: sensorEvent.originalEvent
		});
		this.trigger(resizeChange);
		if (resizeChange.canceled) {
			return;
		} else {
			this.currentAttrs.size = { ...resizeChange.size };
			this.currentAttrs.position = { ...resizeChange.position };
		}

		this.applyResize();
		if (this.helper === this.element) {
			this.updateResizableElements();
		}
	};

	onDragStop = event => {
		const styleProps = {};
		const { animate, flex } = this.options;
		const { size: originalSize, position: originalPosition } = this.originalAttrs;
		const { size, position } = this.currentAttrs;
		const sensorEvent = event.detail;

		if (sensorEvent.caller !== this || !this.currentHandle || !this.currentDirection) {
			return;
		}

		styleProps[flex ? 'flexBasis' : 'width'] = `${width(this.helper)}px`;
		styleProps.height = `${height(this.helper)}px`;
		styleProps.top = `${styleAsNumber(this.helper, 'top')}px`;
		styleProps.left = `${styleAsNumber(this.helper, 'left')}px`;
		style(this.helper, size);
		if (!animate) {
			style(this.element, styleProps);
			this.updateResizableElements();
		}

		const resizeStop = new ResizeStopEvent({
			source: this.element,
			helper: this.helper,
			originalElement: this.originalElement,
			originalSize: this.originalAttrs.size,
			originalPosition: this.originalAttrs.position,
			size,
			position,
			sensorEvent,
			originalEvent: sensorEvent.originalEvent
		});

		this.trigger(resizeStop);
		if (resizeStop.canceled) {
			style(this.element, {
				[flex ? 'flexBasis' : 'width']: `${originalSize.width}px`,
				height: `${originalSize.height}px`,
				top: `${originalPosition.top}px`,
				left: `${originalPosition.left}px`
			});
			this.clear();
			this.updateResizableElements();
		} else {
			this.clear();
		}
	};

	createWrapper() {
		const wrapper = createElement('div', null, this.element.parentNode);

		addClass(wrapper, this.wrapperClass);
		style(wrapper, {
			position: style(this.element, 'position'),
			width: width(this.element),
			height: height(this.element),
			top: style(this.element, 'top'),
			left: style(this.element, 'left'),
			marginTop: style(this.originalElement, 'marginTop'),
			marginRight: style(this.originalElement, 'marginRight'),
			marginBottom: style(this.originalElement, 'marginBottom'),
			marginLeft: style(this.originalElement, 'marginLeft')
		});
		wrapper[this.dataProperty] = this;
		style(this.originalElement, {
			display: 'block',
			position: 'static',
			zoom: 1
		});

		this.originalResize = style(this.originalElement, 'resize');
		style(this.originalElement, {
			resize: 'none'
		});

		this.resizableElements.push(this.originalElement);
		this.updateResizableElements();
		this.wrapped = true;
	}

	destroyWrapper() {
		const wrapper = this.element;
		const { flex } = this.options;

		style(this.originalElement, {
			position: style(wrapper, 'position'),
			[flex ? 'flexBasis' : 'width']: width(wrapper),
			height: height(wrapper),
			top: style(wrapper, 'top'),
			left: style(wrapper, 'left')
		});
		insertAfter(this.originalElement, wrapper);
		remove(wrapper);
		delete wrapper[this.dataProperty];
	}

	createHandles() {
		let { handles } = this.options;
		const { autoHide, zIndex } = this.options;

		if (!handles || !isString(handles)) {
			handles = 'e,s,se';
		} else if (handles === 'all') {
			handles = resizableDirections.join(',');
		}
		this.handleDirections = handles.split(',').map(h => h.trim());
		this.handleDirections.forEach(dir => {
			if (resizableDirections.includes(dir)) {
				const handleEl = createElement('div', null, this.element);

				addClass(handleEl, this.handleClass);
				addClass(handleEl, `${this.elementClass}-${dir}`);
				if (!Resizable.injectedStyles[dir]) {
					injectStyles(`${this.elementClass}-${dir}`, {
						...resizableDirectionStyles[dir],
						...{
							display: 'block',
							position: 'absolute'
						}
					});
					Resizable.injectedStyles = true;
				}
				disableSelection(handleEl);
				style(handleEl, {
					zIndex: zIndex + (dir.length === 2 ? 1 : 0)
				});
				this.listeners.push(
					listen(handleEl, 'mouseover', e => {
						if (!this.pressing) {
							this.currentHandle = e.target;
							this.currentDirection = e.target[this.handleDirectionProperty];
						}
					})
				);
				handleEl[this.handleDirectionProperty] = dir;
				if (autoHide) {
					hide(handleEl);
				}

				if (this.wrapped && isInput(this.originalElement)) {
					const paddingValue = /sw|ne|nw|se|n|s/.test(dir) ? height(handleEl) : width(handleEl);
					const paddingDirection = /ne|nw|n/.test(dir) ? 'Top' : /se|sw|s/.test(dir) ? 'Bottom' : /^e$/.test(dir) ? 'Right' : 'Left';

					style(handleEl, {
						[`padding${paddingDirection}`]: paddingValue
					});
					this.updateResizableElements();
				}

				this.handleElements.push(handleEl);
			}
		});
	}

	findHandles() {
		return this.handleElements;
	}

	destroyHandles() {
		this.handleElements.forEach(handle => {
			delete handle[this.handleDirectionProperty];
			remove(handle);
		});
	}

	createHelper() {
		let helper;
		const { animate, flex, ghost, zIndex } = this.options;
		const elementOffset = offset(this.element);

		if (animate || ghost) {
			helper = createElement('div', null, document.body);
			addClass(helper, this.helperClass);
			style(helper, {
				[flex ? 'flexBasis' : 'width']: `${width(this.element)}px`,
				height: `${height(this.element)}px`,
				position: 'absolute',
				left: `${elementOffset.left}px`,
				top: `${elementOffset.top}px`,
				zIndex: (zIndex || 1) + 1
			});
			disableSelection(helper);
		} else {
			helper = this.element;
		}

		return helper;
	}

	initializeResize() {
		const position = {
			top: styleAsNumber(this.helper, 'top'),
			left: styleAsNumber(this.helper, 'left')
		};

		this.originalAttrs = {
			size: {
				width: width(this.element),
				height: height(this.element)
			},
			position: { ...position }
		};
		this.currentAttrs = {
			size: { ...this.originalAttrs.size },
			position: { ...position }
		};
	}

	calculateResize(event) {
		const { pageX, pageY } = event;
		const { aspectRatio, currentDirection } = this;
		const { click } = this.offset;
		const { size: currentSize, position: currentPosition } = this.currentAttrs;
		const delta = {
			y: pageY - click.top,
			x: pageX - click.left
		};
		let styleProps = resizeTransforms[this.currentDirection](this.originalAttrs, delta);

		if (aspectRatio) {
			if (isFinite(styleProps.width)) {
				styleProps.height = styleProps.width / aspectRatio;
			} else if (isFinite(styleProps.height)) {
				styleProps.width = styleProps.height * aspectRatio;
			}
			if (currentDirection === 'sw') {
				styleProps.left = currentPosition.left + (currentSize.width - styleProps.width);
				styleProps.top = null;
			}
			if (currentDirection === 'nw') {
				styleProps.top = currentPosition.top + (currentSize.height - styleProps.height);
				styleProps.left = currentPosition.left + (currentSize.width - styleProps.width);
			}
		}

		styleProps = this.applyBoundaries(styleProps);

		this.offset.helper = offset(this.helper);
		if (isFinite(styleProps.width)) {
			this.currentAttrs.size.width = styleProps.width;
		}
		if (isFinite(styleProps.height)) {
			this.currentAttrs.size.height = styleProps.height;
		}
		if (isFinite(styleProps.top)) {
			this.currentAttrs.position.top = styleProps.top;
		}
		if (isFinite(styleProps.left)) {
			this.currentAttrs.position.left = styleProps.left;
		}
	}

	applyBoundaries(styleProps) {
		const boundaries = {
			minWidth: isFinite(this.options.minWidth) ? Math.max(this.options.minWidth, 0) : 0,
			maxWidth: isFinite(this.options.maxWidth) ? this.options.maxWidth : Infinity,
			minHeight: isFinite(this.options.minHeight) ? Math.max(this.options.minHeight, 0) : 0,
			maxHeight: isFinite(this.options.maxHeight) ? this.options.maxHeight : Infinity
		};
		const { size: originalSize, position: originalPosition } = this.originalAttrs;
		const isWest = /sw|nw|w/.test(this.currentDirection);
		const isNorth = /nw|ne|n/.test(this.currentDirection);

		if (isFinite(styleProps.width) && boundaries.minWidth > styleProps.width) {
			styleProps.width = boundaries.minWidth;
			if (isWest) {
				styleProps.left = originalPosition.left + originalSize.width - boundaries.minWidth;
			}
		}
		if (isFinite(styleProps.width) && boundaries.maxWidth < styleProps.width) {
			styleProps.width = boundaries.maxWidth;
			if (isWest) {
				styleProps.left = originalPosition.left + originalSize.width - boundaries.maxWidth;
			}
		}
		if (isFinite(styleProps.height) && boundaries.minHeight > styleProps.height) {
			styleProps.height = boundaries.minHeight;
			if (isNorth) {
				styleProps.top = originalPosition.top + originalSize.height - boundaries.minHeight;
			}
		}
		if (isFinite(styleProps.height) && boundaries.maxHeight < styleProps.height) {
			styleProps.height = boundaries.maxHeight;
			if (isNorth) {
				styleProps.top = originalPosition.top + originalSize.height - boundaries.maxHeight;
			}
		}

		return styleProps;
	}

	applyResize() {
		const styleProps = {};
		const { flex } = this.options;
		const { size, position } = this.currentAttrs;
		const { size: prevSize, position: prevPosition } = this.previousAttrs;

		if (size.width !== prevSize.width) {
			styleProps[flex ? 'flexBasis' : 'width'] = `${size.width}px`;
		}
		if (size.height !== prevSize.height) {
			styleProps.height = `${size.height}px`;
		}
		if (position.top !== prevPosition.top) {
			styleProps.top = `${position.top}px`;
		}
		if (position.left !== prevPosition.left) {
			styleProps.left = `${position.left}px`;
		}
		style(this.helper, styleProps);

		return styleProps;
	}

	updateResizableElements(dimensions = null) {
		if (!this.resizableElements.length) {
			return;
		}

		const { flex } = this.options;
		const finalDimensions =
			dimensions && dimensions.width && dimensions.height
				? dimensions
				: {
						width: width(this.helper || this.element),
						height: height(this.helper || this.element)
				  };

		this.resizableElements.forEach(el => {
			const innerDimensions = getPaddingAndBorder(el);

			style(el, {
				[flex ? 'flexBasis' : 'width']: `${finalDimensions.width - innerDimensions.width}px`,
				height: `${finalDimensions.height - innerDimensions.height}px`
			});
		});
	}

	clear() {
		this.resizing = false;
		this.originalAttrs = {};
		this.currentAttrs = {};
		this.previousAttrs = {};
		this.offset = {
			click: null,
			helper: null
		};
		this.aspectRatio = null;
		if (this.helper && this.helper !== this.element) {
			this.helper.parentNode.removeChild(this.helper);
			this.helper = null;
		}
		style(document.body, {
			cursor: 'auto'
		});
		removeClass(this.element, this.resizingClass);
		if (this.pendingDestroy) {
			this.destroy();
			this.pendingDestroy = false;
		}
	}
}
