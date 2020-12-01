import { getParents } from '../util';

let instance = null;

export class DragDropManager {
	draggable = null;

	droppables = {};

	getDroppables = scope => {
		return this.droppables[scope] || [];
	};

	addDroppable = (droppable, scope) => {
		if (droppable && scope) {
			if (!this.droppables[scope]) {
				this.droppables[scope] = [];
			}
			this.droppables[scope].push(droppable);
		}
	};

	removeDroppable = (droppable, scope) => {
		if (droppable && this.droppables[scope]) {
			this.droppables[scope] = this.droppables[scope].filter(item => item !== droppable);
		}
	};

	prepareOffsets = (draggable, event) => {
		const { type } = event;

		this.draggable = draggable;
		this.getDroppables(draggable.scope).forEach(droppable => {
			droppable.refreshVisibility();
			if (droppable.visible) {
				if (droppable.accept(draggable)) {
					if (type === 'mouse:start') {
						droppable.activate(event);
					}
					droppable.refreshProportions();
				}
			}
		});
	};

	onDragMove = (draggable, event) => {
		this.getDroppables(draggable.scope).forEach(droppable => {
			const intersects = droppable.intersect(draggable, event);

			if ((intersects && !droppable.isOver) || (!intersects && droppable.isOver)) {
				let parentDroppable;
				const { element } = droppable;
				const { greedy, scope } = droppable.options;

				if (greedy) {
					const parents = getParents(element).filter(
						element => element[droppable.dataProperty] && element[droppable.dataProperty].options.scope === scope
					);
					if (parents.length > 0) {
						parentDroppable = parents[0][droppable.dataProperty];
						parentDroppable.greedyChild = intersects;
						if (intersects) {
							parentDroppable.out(event);
						}
					}
				}

				if (intersects) {
					droppable.over(event);
				} else {
					droppable.out(event);
				}

				if (parentDroppable && !intersects) {
					parentDroppable.over(event);
				}
			}
		});
	};

	onDragStop = (draggable, event) => {
		this.prepareOffsets(draggable, event);
	};

	drop = (draggable, event) => {
		let dropped = null;

		this.getDroppables(draggable.scope).forEach(droppable => {
			if (droppable.intersect(draggable, event)) {
				dropped = droppable.drop(event) || dropped;
			}
			if (droppable.accept(draggable)) {
				droppable.deactivate(event);
			}
		});

		this.draggable = null;

		return dropped;
	};
}

if (!instance) {
	instance = new DragDropManager();
}

export default instance;
