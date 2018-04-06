import EventListener from './event_listener';
import Mixcloud from './mixcloud';

export default class Playback extends EventListener {

	constructor (url, startPlaying) {
		
		super();

		this.url = url;

		var fakeIframe = this.iframe = document.createElement('iframe');
		fakeIframe.style.display = 'none';

		// Setting sandbox disables MixCloud from using cookies and localStorage. 
		// As a result, we can disable functionality like pausing across multiple tabs, 
		//  and remembering the last play time/location. 
		fakeIframe.sandbox = 'allow-scripts';

		fakeIframe.src = 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=' + escape(url);

		document.body.appendChild(fakeIframe);

		this.ready();

		this.duration = 0;
		this.mixcloud = new Mixcloud(fakeIframe);

		this.mixcloud.ready.then((a) => {
			this.load(url, startPlaying).then((e) => {
				this.getVolume().then((vol) => {
					this.loadAPIData().then((f) => {

						this.setData(e);
						this.readyResolve();

						startPlaying && this.play();

					});
				});
			});
		})

		this.mixcloud.addEventListener('progress', (e) => { e.playback = this; this.dispatchEvent(e) });
		this.mixcloud.addEventListener('play', (e) => { e.playback = this; this.dispatchEvent(e) });
		this.mixcloud.addEventListener('pause', (e) => { e.playback = this; this.dispatchEvent(e) });
		this.mixcloud.addEventListener('ended', (e) => { e.playback = this; this.dispatchEvent(e) });
		this.mixcloud.addEventListener('error', (e) => { e.playback = this; this.dispatchEvent(e) });
		this.mixcloud.addEventListener('buffering', (e) => { e.playback = this; this.dispatchEvent(e) });

	}

	setData (e) {
		this.data = e;
	}

	ready () {
		this.ready = new Promise((resolve, reject) => {
			this.readyResolve = resolve;
		}).then(_ => {
			delete this.readyResolve;
		})
	}

	destroy () {
		this.mixcloud.destoy();
		document.body.removeChild(this.iframe);
	}

	load (url, startPlaying) {
		return this.mixcloud.send('load', [url, startPlaying]);
	}
	
	play () {
		return this.mixcloud.send('play');
	}

	pause () {
		return this.mixcloud.send('pause');
	}

	toggle () {
		return this.mixcloud.send('togglePlay');
	}

	seek (offset) {
		return this.mixcloud.send('seek', [offset]);
	}

	loadAPIData () {
		return new Promise((resolve, reject) => {
			fetch('https://api.mixcloud.com' + this.url)
			.then((a) => a.json())
			.then((a) => this.setMetadata(a))
			.then((a) => resolve(a))
			.catch((a) => resolve(null))
		})
	}

	getVolume () {
		return this.mixcloud.send('getVolume')
		.then((a) => a.value);
	}

	setVolume (volume) {
		return this.mixcloud.send('setVolume', [volume]);
	}

	setMetadata (data) {

		this.duration = data.audio_length;
		this.title = data.name;
		this.description = data.description;

		return data;

	}

}

