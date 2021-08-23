const draggableProp = 'draggableInstance';
const draggableEl = 'ui-draggable';
const draggableHandle = 'ui-draggable-handle';
const draggableHelper = 'ui-draggable-helper';
const droppableProp = 'droppableInstance';
const droppableEl = 'ui-droppable';
const droppableActive = 'ui-droppable-active';
const droppableHover = 'ui-droppable-hover';
const sortableProp = 'sortableInstance';
const sortableEl = 'ui-sortable';
const sortableHandle = 'ui-sortable-handle';
const sortableHelper = 'ui-sortable-helper';
const sortablePlaceholder = 'ui-sortable-placeholder';
const resizableProp = 'resizableInstance';
const resizableEl = 'ui-resizable';
const resizableWrapper = 'ui-resizable-wrapper';
const resizableAutoHide = 'ui-resizable-autohide';
const resizableHandle = 'ui-resizable-handle';
const resizableHandleProp = 'resizableDirection';
const resizableHelper = 'ui-resizable-helper';
const resizableResizing = 'ui-resizable-resizing';
const resizableGhost = 'ui-resizable-ghost';
const resizableDirections = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const resizableCornerIcons = {
	ne: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 16 16"><g><polygon points="16,0 16,16 0,0" fill="darkgray" /></g></svg>',
	nw: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 16 16"><g><polygon points="0,0 0,16 16,0" fill="darkgray" /></g></svg>',
	se: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 16 16"><g><polygon points="0,16 16,16 16,0" fill="darkgray" /></g></svg>',
	sw: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 16 16"><g><polygon points="0,0 0,16 16,16" fill="darkgray" /></g></svg>'
};
const resizableDirectionStyles = {
	n: {
		cursor: 'n-resize',
		height: '7px',
		width: '100%',
		top: '-5px',
		left: '0'
	},
	s: {
		cursor: 's-resize',
		height: '7px',
		width: '100%',
		bottom: '-5px',
		left: '0'
	},
	e: {
		cursor: 'e-resize',
		width: '7px',
		right: '-5px',
		top: '0',
		height: '100%'
	},
	w: {
		cursor: 'w-resize',
		width: '7px',
		left: '-5px',
		top: '0',
		height: '100%'
	},
	nw: {
		cursor: 'nw-resize',
		width: '12px',
		height: '12px',
		left: '1px',
		top: '1px',
		backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(resizableCornerIcons.nw)}')`,
		backgroundPosition: 'center',
		backgroundRepeat: 'no-repeat'
	},
	ne: {
		cursor: 'ne-resize',
		width: '12px',
		height: '12px',
		right: '1px',
		top: '1px',
		backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(resizableCornerIcons.ne)}')`,
		backgroundPosition: 'center',
		backgroundRepeat: 'no-repeat'
	},
	se: {
		cursor: 'se-resize',
		width: '12px',
		height: '12px',
		right: '1px',
		bottom: '1px',
		backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(resizableCornerIcons.se)}')`,
		backgroundPosition: 'center',
		backgroundRepeat: 'no-repeat'
	},
	sw: {
		cursor: 'sw-resize',
		width: '12px',
		height: '12px',
		left: '1px',
		bottom: '1px',
		backgroundImage: `url('data:image/svg+xml;utf8,${encodeURIComponent(resizableCornerIcons.sw)}')`,
		backgroundPosition: 'center',
		backgroundRepeat: 'no-repeat'
	}
};

export {
	draggableProp,
	draggableEl,
	draggableHandle,
	draggableHelper,
	droppableProp,
	droppableEl,
	droppableActive,
	droppableHover,
	sortableProp,
	sortableEl,
	sortableHandle,
	sortableHelper,
	sortablePlaceholder,
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
};

export default {
	draggableProp,
	draggableEl,
	draggableHandle,
	draggableHelper,
	droppableProp,
	droppableEl,
	droppableActive,
	droppableHover,
	sortableProp,
	sortableEl,
	sortableHandle,
	sortableHelper,
	sortablePlaceholder,
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
};
