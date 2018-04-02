import EventListener from './event_listener';

export default class Mixcloud extends EventListener {

	/**
	 * Takes an iframe (should be a MixCloud widget) and 
	 */
	constructor (iframe) {

		super();

		this.iframe = iframe;
		this.counter = Date.now();
		this.ready = new Promise(this.ready.bind(this));

		this._listener = this.onMessage.bind(this);
		window.addEventListener('message', this._listener);

		try {
			this.sendData('getApi');
		} catch (e) {
			// not yet ready
		}

	}

	ready (resolve, reject) {

		this.rejectTimer = setTimeout(reject, 15000);

		this.resolveReady = () => {
			clearTimeout(this.rejectTimer);
			delete this.rejectTimer;
			this.ready = true;
			delete this.resolveReady;
			resolve();
		}

	}

	destroy () {
		window.removeEventListener('message', this._listener)
	}

	handleEvent (event) {
		this.dispatchEvent(event);
	}

	onMessage (event) {

		console.log('rx', event, this)

		if (event.source != this.iframe.contentWindow) {
			return;
		}

		let data = JSON.parse(event.data);

		switch (data.type) {
			case 'ready':
				this.sendData('getApi');
				break;
			case 'event': 
				this.handleEvent(data.data);
				break;
			case 'api':
				this.bootstrap(data.data);
				break;
			case 'methodResponse':
				this.handlePromise(data.data);
		}

	}

	bootstrap () {
		this.resolveReady();
	}

	send (methodName, args, override) {

		if (this.ready !== true && !override) {
			throw Error('Not ready');
		}

		if (!this.pending) {
			this.pending = {};
		}

		return new Promise((resolve, reject) => {

			let id = this.counter++;

			this.sendData('method', { 
				methodName: methodName,
				methodId: id,
				args: args
			});

			this.pending[id] = [resolve, reject, setTimeout(5000, reject)];

		})
	}

	handlePromise (data) {

		console.log('promise', data)

		let pending = this.pending[data.methodId];

		if (!pending) {
			throw Error('Something really bad happened internally, trying to reference a promise that no longer exists')
		}

		pending[0](data);

		clearTimeout(pending[2]);
		delete this.pending[data.methodId];

	}


	post (data) {
		this.iframe.contentWindow.postMessage(data, 'https://www.mixcloud.com');
	}

	sendData (type, data) {
		this.post(JSON.stringify({ type: type, data: data }));
	}

}
