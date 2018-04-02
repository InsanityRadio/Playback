import EventListener from './event_listener';
import Mixcloud from './mixcloud';

export default class Playback extends EventListener {

	constructor (url, startPlaying) {
		
		super();

		var fakeIframe = this.iframe = document.createElement('iframe');
		fakeIframe.style.display = 'none';
		fakeIframe.src = 'https://www.mixcloud.com/widget/iframe/?feed=' + escape(url);

		document.body.appendChild(fakeIframe);

		this.ready();

		this.mixcloud = new Mixcloud(fakeIframe);

		this.mixcloud.ready.then((a) => {
			this.load(url, startPlaying).then((e) => {
				console.log('mawp')
				this.readyResolve();
				if (startPlaying) {
					this.play();
				}
			});
		})

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

}

