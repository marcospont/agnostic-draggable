import EventEmitter from 'events';

export default class CancelableEventEmitter extends EventEmitter {
	wrappedListeners = [];

	wrapListener(listener) {
		let wrapped = this.wrappedListeners.find(item => item.listener === listener);

		if (!wrapped) {
			wrapped = {
				listener,
				wrapped: event => {
					if (!event || !event.canceled) {
						listener(event);
					}
				}
			};
			this.wrappedListeners.push(wrapped);
		} else {
			this.wrappedListeners = this.wrappedListeners.filter(item => item !== wrapped);
		}

		return wrapped;
	}

	addListener(type, listener) {
		super.addListener(type, this.wrapListener(listener));
	}

	prependListener(type, listener) {
		super.prependListener(type, this.wrapListener(listener));
	}

	removeListener(type, listener) {
		super.off(type, this.wrapListener(listener));
	}
}
