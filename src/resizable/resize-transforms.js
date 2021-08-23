export default {
	n: (originalAttrs, delta) => {
		return {
			height: Math.max(originalAttrs.size.height - delta.y, 0),
			top: originalAttrs.position.top + delta.y
		};
	},
	s: (originalAttrs, delta) => {
		return {
			height: Math.max(originalAttrs.size.height + delta.y, 0)
		};
	},
	e: (originalAttrs, delta) => {
		return {
			width: Math.max(originalAttrs.size.width + delta.x, 0)
		};
	},
	w: (originalAttrs, delta) => {
		return {
			width: Math.max(originalAttrs.size.width - delta.x, 0),
			left: originalAttrs.position.left + delta.x
		};
	},
	ne: (originalAttrs, delta) => {
		return {
			width: Math.max(originalAttrs.size.width + delta.x, 0),
			height: Math.max(originalAttrs.size.height - delta.y, 0),
			top: originalAttrs.position.top + delta.y
		};
	},
	nw: (originalAttrs, delta) => {
		return {
			width: Math.max(originalAttrs.size.width - delta.x, 0),
			height: Math.max(originalAttrs.size.height - delta.y, 0),
			top: originalAttrs.position.top + delta.y,
			left: originalAttrs.position.left + delta.x
		};
	},
	se: (originalAttrs, delta) => {
		return {
			width: Math.max(originalAttrs.size.width + delta.x, 0),
			height: Math.max(originalAttrs.size.height + delta.y, 0)
		};
	},
	sw: (originalAttrs, delta) => {
		return {
			width: Math.max(originalAttrs.size.width - delta.x, 0),
			height: Math.max(originalAttrs.size.height + delta.y, 0),
			left: originalAttrs.position.left + delta.x
		};
	}
};
