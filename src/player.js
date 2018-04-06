import EventListener from './event_listener';
import Playback from './playback';

const STYLE = require('./player.css');
const BRAND = 'Insanity Radio';

export default class Player {


	constructor (container) {

		this.container = container;
		this.playback = null;
		this.loadCSS();

		container.innerHTML = `
			<div class="insanity-player">
				<div class="container">
					<!-- put some visual here -->
					<img src="https://insanityradio.com/wp-content/uploads/sites/4/2017/03/2272787480_f0e5358896_o-e1490988529369.jpg" />
				</div>
				<div class="preload">
					<div class="insanity-preloader"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
				</div>
				<div class="overlay">
					<div class="overlay-blocked">
						<h1 class="overlay-title">Ad Blocker Problem</h1>
						<div class="overlay-body">
							<p>You're seeing this because you may have an ad-blocker which is affecting our player.</p>
							<p>Some ad-blockers can interfere with MixCloud, our content provider. MixCloud sometimes roll adverts, to make sure artists we play get paid royalties.</p>
							<p>Disabling your ad-blocker/anti-tracker for ${BRAND} doesn't necessarily disable it for MixCloud. We don't track you.</p>
						</div>
					</div>
					<div class="overlay-error">
						<h1 class="overlay-title">Load Error</h1>
						<div class="overlay-body">
							<p>There was an error communicating with MixCloud. Please check your Internet connection.</p>
							<p>You can try listening to this episode directly on their website.</p>
						</div>
					</div>
				</div>
				<div class="controls">
					<div class="top">
						<input type=range min=0 max=100 step=0.1 class="player-slider position-slider" />
					</div>
					<div class="bottom">
						<button class="player-button play-button"><i class="fa fa-play"></i></button>
						<div class="timestamp">
							<span class="now timestamp-label">00:00:00</span> /
							<span class="length-label">01:03:03</span>
						</div>
						<div class="right volume">
							<button class="player-button"><i class="fa fa-volume-up"></i></button>
							<input type=range min=0 max=1 value=1 step=0.05 class="player-slider volume-slider" />
						</div>
					</div>
				</div>
			</div>`;

		this.containers =  {
			mediaContent: container.querySelector('.container'),
			preload: container.querySelector('.preload'),
			buttons: {
				play: container.querySelector('.play-button'),
			},
			sliders: {
				position: container.querySelector('.position-slider'),
				volume: container.querySelector('.volume-slider')
			},
			labels: {
				timestamp: container.querySelector('.timestamp-label'),
				length: container.querySelector('.length-label'),
			}
		}

		this.playing = false;
		this.buffering = true;
		this.currentTime = 0;
		this.duration = 0;

		this.addListeners();
		this.drawAll();

	}

	load (type, url, image) {

		this.playback && this.playback.destroy();
		this.playback = new Playback(url);

		this.playback.ready.then((a) => {
			this.drawAll();
		})

		if (image) {
			this.containers.mediaContent.querySelector('img').src = image;
		}

		this.playback.addEventListener('play', (e) => this.handlePlay(e))
		this.playback.addEventListener('pause', (e) => this.handlePause(e))
		this.playback.addEventListener('ended', (e) => this.handleEnded(e))
		this.playback.addEventListener('progress', (e) => this.handleProgress(e))
		this.playback.addEventListener('buffering', (e) => this.handleBuffer(e))
		this.playback.addEventListener('error', (e) => this.handleError(e))

	}

	addListeners () {

		this.containers.buttons.play.addEventListener('click', () => {
			if (this.playing) {
				this.playback.toggle().then((a) => this.drawAll());
			} else {
				this.playback.play().then((a) => this.drawAll());
			}
		})

		// 
		this.containers.sliders.position.addEventListener('mousedown', () => {
			// Storing the last state allows us to simualate seeking in audio
			this._isMouseDown = true;
			this.wasPlaying = this.playing;
			this.playback.pause();
		})

		this.containers.sliders.position.addEventListener('mouseup', () => {
			this._isMouseDown = false;
			this.wasPlaying && this.playback.play();
			this.containers.sliders.position.blur();
		})

		this.containers.sliders.position.addEventListener('change', (e) => {
			this.playback.seek(e.target.value)
		})

		this.containers.sliders.volume.addEventListener('change', (e) => {
			this.playback.setVolume(e.target.value);
		})

	}

	/*
	private */
	loadCSS () {

		const identifier = 'style_____insanity_player';

		if (document.getElementById(identifier)) {
			return;
		}

		var style = document.createElement('style');
		style.innerHTML = STYLE;
		style.attributes.id = identifier;
		document.body.appendChild(style);

	}

	handlePlay () {
		this.playing = true;
		this.buffering = false;
		this.drawAll();
	}

	handlePause () {
		this.playing = false;
		this.buffering = false;
		this.drawAll();
	}

	handleEnded () {
		this.playing = false;
		this.buffering = false;
		this.currentTime = 0;
		this.drawAll();
	}

	handleError () {
		this.playing = false;
		this.drawAll();
	}

	handleBuffer () {
		this.playing = false;
		this.buffering = true;
		this.drawAll();
	}

	handleProgress (e) {

		this.currentTime = e.args[0];

		if (this.duration != e.args[1]) {
			this.duration = e.args[1];
			this.drawAll();
		} else {
			this.drawMost();
		}

	}

	getDuration () {
		return this.duration || (this.playback && this.playback.duration) || 0;
	}

	getOffset () {
		return this.currentTime || 0;
	}

	drawAll () {

		let duration = this.getDuration()
		this.containers.sliders.position.max = duration || 0;
		this.containers.labels.length.textContent = this.tsToString(duration, duration >= 3600);

		this.containers.buttons.play.querySelector('i').className = 'fa fa-' + (this.playing ? 'pause' : 'play');

		this.playback && this.playback.getVolume().then((vol) => {
			this.containers.sliders.volume.value = vol;
		})

		this.drawMost();
	}

	drawMost () {

		if (!this._isMouseDown) {
			this.containers.sliders.position.value = this.getOffset() || 0;
		}
		this.containers.labels.timestamp.textContent = this.tsToString(this.getOffset(), this.getDuration() >= 3600);

		this.containers.preload.classList[this.buffering ? 'add' : 'remove']('show');

	}

	tsToString (seconds, hour) {

		hour = hour || false;
		return (hour ? [3600, 60, 1] : [60, 1]).map((a, i) => 
			('00' + Math.floor((i ? (seconds / a % 60) : (seconds/a)))
		).substr(-2)).join(':');

	}

}

