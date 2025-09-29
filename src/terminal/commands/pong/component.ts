import { css, html, type PropertyValues, svg } from 'lit';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';
import { Component } from '../../../litutil/Component.ts';
import type { Unsubscribe } from '../../../services/reactive.ts';
import { ReactiveObject } from '../../../services/reactive-object.ts';
import { observeSize } from '../../../services/size.ts';
import type { Terminal } from '../../../Terminal.ts';
import { type GameConfig, PongGame } from './game.ts';

const GAME_HEIGHT = 300;

class PongComponent extends Component {
	static styles = css`
		.pong {
			width: 100%;
			height: var(--height, 300px);

			background-color: rgba(0, 0, 0, 0.2);
			display: flex;
			position: relative;
		}

		.overlay {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			color: white;
			font-size: 20px;
			pointer-events: none;
			text-align: center;
		}

		.game-over {
			font-size: 32px;
			font-weight: bold;
		}

		.score {
			height: 100%;
			font-size: 48px;
		}

		.controls {
			margin-bottom: 5px;
			display: flex;
			gap: 20px;

			.group {
				display: flex;
				align-items: center;
				gap: 8px;
			}
		}

		.key {
			min-width: 25px;
			height: 25px;
			display: inline-flex;
			justify-content: center;
			align-items: center;
			padding: 0 4px;
		}
	`;

	#localStorageKey: string = 'terminal-pong-highscore';

	gameConfig: ReactiveObject<GameConfig>;
	pongGame: PongGame | null = null;

	@property({ attribute: false }) terminal: Terminal | null = null;
	@property({ type: Boolean, attribute: 'enable-2nd-player' }) enable2ndPlayer = false;

	@state()
	get highscore() {
		const stored = localStorage.getItem(this.#localStorageKey);
		if (stored) {
			return parseInt(stored, 10);
		}
		return 0;
	}
	set highscore(value: number) {
		localStorage.setItem(this.#localStorageKey, value.toString());
	}

	#subscriptions: Unsubscribe[] = [];

	get has2ndPlayer() {
		return this.enable2ndPlayer;
	}

	constructor() {
		super();

		this.gameConfig = new ReactiveObject<GameConfig>({
			ball: { size: 10, speed: 10 },
			field: { width: 0, height: GAME_HEIGHT },
			paddle: { width: 10, height: 50, speed: 5 },
			pointsToWin: 5,
		});
	}

	connectedCallback(): void {
		super.connectedCallback();
	}

	firstUpdated(changedProperties: PropertyValues) {
		super.firstUpdated(changedProperties);

		if (!this.terminal) {
			throw new Error('Terminal not set');
		}

		const resize = observeSize(this.terminal);

		const mode = this.has2ndPlayer ? 'two-player' : 'single-player';

		this.pongGame = new PongGame(mode, this.gameConfig);
		this.pongGame.state.subscribeHost(this, false);
		this.pongGame.config.subscribeHost(this, false);
		this.pongGame.setup();

		this.#subscriptions.push(
			resize.subscribe(() => {
				this.gameConfig.$.field.width = this.rect.width;
			}, true),
		);

		this.#subscriptions.push(
			this.pongGame.phase.subscribe(phase => {
				switch (phase) {
					case 'stopped':
					case 'game-over': {
						const score = this.pongGame?.state.$.playerLeft.score || 0;
						if (score > this.highscore) {
							this.highscore = score;
						}
						break;
					}
				}

				switch (phase) {
					case 'stopped':
						this.terminal?.enableInput().then(() => {
							this.terminal?.focusInput();
						});
						this.unsubscribeAll();
						break;
				}
			}, true),
		);
	}

	unsubscribeAll() {
		for (const unsub of this.#subscriptions) {
			unsub();
		}
		this.#subscriptions = [];
	}

	get game() {
		if (!this.pongGame) {
			throw new Error('Pong game not initialized');
		}
		return this.pongGame;
	}

	renderControls() {
		if (this.has2ndPlayer) {
			return html`
				<div class="controls">
					<div class="group">
						Left:
						<mh-pixel-border>
							<span class="key">W</span>
						</mh-pixel-border>
						<mh-pixel-border>
							<span class="key">S</span>
						</mh-pixel-border>
					</div>
					<div class="group">
						Right:
						<mh-pixel-border>
							<span class="key">↑</span>
						</mh-pixel-border>
						<mh-pixel-border>
							<span class="key">↓</span>
						</mh-pixel-border>
					</div>
					<div class="group">
						Exit:
						<mh-pixel-border>
							<span class="key">ESC</span>
						</mh-pixel-border>
					</div>
					<div class="group">
						First to 5 wins.
					</div>
				</div>
			`;
		}
		return html`
			<div class="controls">
				<div class="group">
					Controls:
					<mh-pixel-border>
						<span class="key">W</span>
					</mh-pixel-border>
					<mh-pixel-border>
						<span class="key">S</span>
					</mh-pixel-border> /
					<mh-pixel-border>
						<span class="key">↑</span>
					</mh-pixel-border>
					<mh-pixel-border>
						<span class="key">↓</span>
					</mh-pixel-border>
					to move
				</div>

				<div class="group">
					Exit:
					<mh-pixel-border>
						<span class="key">ESC</span>
					</mh-pixel-border>
				</div>
			</div>
		`;
	}

	renderOverlay() {
		const state = this.game.state.$;
		switch (state?.phase) {
			case 'initial':
				return html`
					<div>
						<span>Press Space to start the game</span>
						<br />
						Highscore: ${this.highscore}
					</div>
				`;
			case 'running': {
				if (this.game.has2ndPlayer) {
					return html`
					<div class='score'>
						${state.playerLeft.score} : ${state.playerRight.score}
					</div>
				`;
				}
				return html`
					<div class='score'>
						${state.playerLeft.score}
					</div>
				`;
			}
			case 'point-scored':
				return html`
					<div>
						<span>${state.playerLeft.score} : ${state.playerRight.score}</span>
						<br />
						Press Space to continue
					</div>
				`;
			case 'game-over':
			case 'stopped': {
				if (this.game.has2ndPlayer) {
					let winnerText = '';
					if (state.playerLeft.score > state.playerRight.score) {
						winnerText = 'Left Player Wins!';
					} else if (state.playerRight.score > state.playerLeft.score) {
						winnerText = 'Right Player Wins!';
					} else {
						winnerText = "It's a Tie!";
					}
					return html`
					<div>
						<span class="game-over">
							${winnerText}
						</span>
						<br />
						${state.playerLeft.score} : ${state.playerRight.score}
						<br />
						${state.phase === 'game-over' ? 'Press ESC to exit or Space to restart' : ''}
					</div>
				`;
				}
				return html`
					<div>
						<span class="game-over">Game Over!</span>
						<br />
						Score: ${state.playerLeft.score} | Highscore: ${this.highscore}
						<br />
						${state.phase === 'game-over' ? 'Press ESC to exit or Space to restart' : ''}
					</div>
				`;
			}
		}
	}

	renderGame() {
		const state = this.game.state.$;
		const config = this.game.config.$;
		return html`
			<svg width="100%" height="100%">
				${svg`
					<rect
						x="0"
						y="${state.playerLeft.position.y - config.paddle.height / 2}"
						width="${config.paddle.width}"
						height="${config.paddle.height}"
						fill="white"
					></rect>
					<rect
						x="${config.field.width - config.paddle.width}"
						y="${state.playerRight.position.y - config.paddle.height / 2}"
						width="${config.paddle.width}"
						height="${config.paddle.height}"
						fill="white"
					></rect>
					${
						state.phase === 'running'
							? svg`
								<circle cx="${state.ball.position.x}" cy="${state.ball.position.y}" r="${config.ball.size / 2}" fill="white"></circle>
								`
							: ''
					}
				`}
			</svg>
		`;
	}

	render() {
		if (!this.pongGame) {
			return html`<div>Loading...</div>`;
		}
		return html`
			<style>
				:host {
					--height: ${GAME_HEIGHT}px;
				}
			</style>
			${this.renderControls()}
			<div class="pong">
				${this.renderGame()}
				<div class="overlay">
					${this.renderOverlay()}
				</div>
			</div>
		`;
	}
}

customElements.define('mh-terminal-pong', PongComponent);
