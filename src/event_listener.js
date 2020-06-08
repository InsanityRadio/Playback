export default class EventListener {

	addEventListener (event, handler) {

		this._handlers || (this._handlers = {});
		this._handlers[event] || (this._handlers[event] = []);
		this._handlers[event].push(handler);

	}

	removeEventListener (event, handler) {

		if (!this._handlers || !this._handlers[event]) {
			return;
		}
		this._handlers[event] = this._handlers[event].filter(e => e !== handler);

	}

	dispatchEvent (event) {
		if (event.type && !event.eventName) event.eventName = event.type;
		event.eventName && this._handlers && this._handlers[event.eventName] &&
			this._handlers[event.eventName].forEach((e) => e(event));
	}

}