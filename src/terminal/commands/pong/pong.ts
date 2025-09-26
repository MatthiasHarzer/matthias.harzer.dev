import { css, html, type PropertyValues, svg } from 'lit';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';
import { Component } from '../../../litutil/Component.ts';
import { keyListener } from '../../../services/hotkey-listener.ts';
import type { Unsubscribe } from '../../../services/reactive.ts';
import { observeSize } from '../../../services/size.ts';
import type { Terminal } from '../../../Terminal.ts';
import { type Command, component, type TerminalFunction } from '../../terminal.ts';

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
		}

		.pixel-corners{
			  clip-path: polygon(0px calc(100% - 4px),
    2px calc(100% - 4px),
    2px calc(100% - 2px),
    4px calc(100% - 2px),
    4px 100%,
    calc(100% - 4px) 100%,
    calc(100% - 4px) calc(100% - 2px),
    calc(100% - 2px) calc(100% - 2px),
    calc(100% - 2px) calc(100% - 4px),
    100% calc(100% - 4px),
    100% 4px,
    calc(100% - 2px) 4px,
    calc(100% - 2px) 2px,
    calc(100% - 4px) 2px,
    calc(100% - 4px) 0px,
    4px 0px,
    4px 2px,
    2px 2px,
    2px 4px,
    0px 4px);
  position: relative;
		}
		.pixel-corners {
			border: 2px solid transparent;
		}

		.pixel-corners::after{
			content: "";
			position: absolute;
			clip-path: polygon(0px calc(100% - 4px),
				2px calc(100% - 4px),
				2px calc(100% - 2px),
				4px calc(100% - 2px),
				4px 100%,
				calc(100% - 4px) 100%,
				calc(100% - 4px) calc(100% - 2px),
				calc(100% - 2px) calc(100% - 2px),
				calc(100% - 2px) calc(100% - 4px),
				100% calc(100% - 4px),
				100% 4px,
				calc(100% - 2px) 4px,
				calc(100% - 2px) 2px,
				calc(100% - 4px) 2px,
				calc(100% - 4px) 0px,
				4px 0px,
				4px 2px,
				2px 2px,
				2px 4px,
				0px 4px,
				0px 50%,
				2px 50%,
				2px 4px,
				4px 4px,
				4px 2px,
				calc(100% - 4px) 2px,
				calc(100% - 4px) 4px,
				calc(100% - 2px) 4px,
				calc(100% - 2px) calc(100% - 4px),
				calc(100% - 4px) calc(100% - 4px),
				calc(100% - 4px) calc(100% - 2px),
				4px calc(100% - 2px),
				4px calc(100% - 4px),
				2px calc(100% - 4px),
				2px 50%,
				0px 50%);
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			background: currentColor;
			display: block;
			pointer-events: none;
		}
		.pixel-corners::after {
			margin: -2px;
		}

		.key {
			min-width: 25px;
			height: 25px;
			display: inline-flex;
			justify-content: center;
			align-items: center;
			margin: 0 2px;
			padding: 0 4px;
		}
	`;

	#paddleHeight: number = 50;
	#paddleWidth: number = 10;
	#ballSize: number = 10;
	#height: number = 300;
	#paddleSpeed: number = 5;
	#ballSpeed: number = 10;
	#localStorageKey: string = 'terminal-pong-highscore';

	@property({ attribute: false }) terminal: Terminal | null = null;

	@state() width = 300;

	@state() ballX: number = 150;
	@state() ballY: number = 150;
	@state() ballVX: number = this.#ballSpeed / 2;
	@state() ballVY: number = this.#ballSpeed / 2;
	@state() paddleAY: number = 150;
	@state() paddleBY: number = 150;
	@state() score: number = 0;
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

	@state() state: 'initial' | 'running' | 'stopped' = 'initial';
	@state() isGameOver: boolean = true;

	#subscriptions: Unsubscribe[] = [];

	restart() {
		if (!this.isGameOver) return;
		this.score = 0;
		this.state = 'running';
		this.isGameOver = false;
		this.resetBall();
	}

	exit() {
		this.isGameOver = true;
		this.state = 'stopped';
		this.terminal?.enableInput().then(() => {
			this.terminal?.focusInput();
		});
		this.unsubscribeAll();
	}

	paddleYUp(delta: number) {
		this.paddleAY -= this.#paddleSpeed * delta;
		if (this.paddleAY - this.#paddleHeight / 2 < 0) {
			this.paddleAY = this.#paddleHeight / 2;
		}
	}

	paddleYDown(delta: number) {
		this.paddleAY += this.#paddleSpeed * delta;
		if (this.paddleAY + this.#paddleHeight / 2 > this.#height) {
			this.paddleAY = this.#height - this.#paddleHeight / 2;
		}
	}

	adjustAIPaddle(delta: number) {
		// calclulate the target position where the ball will hit the right paddle
		const timeToReachPaddle = (this.width - this.ballX) / this.ballVX;
		let targetY = this.ballY + this.ballVY * timeToReachPaddle;

		// reflect off top and bottom walls
		while (targetY < 0 || targetY > this.#height) {
			if (targetY < 0) {
				targetY = -targetY;
			} else if (targetY > this.#height) {
				targetY = 2 * this.#height - targetY;
			}
		}

		// move the paddle towards the target position smoothly
		if (this.paddleBY < targetY - 10) {
			this.paddleBY += this.#paddleSpeed * delta;
		} else if (this.paddleBY > targetY + 10) {
			this.paddleBY -= this.#paddleSpeed * delta;
		}

		// clamp the paddle position within the game area
		if (this.paddleBY - this.#paddleHeight / 2 < 0) {
			this.paddleBY = this.#paddleHeight / 2;
		} else if (this.paddleBY + this.#paddleHeight / 2 > this.#height) {
			this.paddleBY = this.#height - this.#paddleHeight / 2;
		}
	}

	gameOver() {
		this.isGameOver = true;
		if (this.score > this.highscore) {
			this.highscore = this.score;
		}
	}

	checkLeftPaddleCollision() {
		const hitLeft = this.ballX - this.#ballSize / 2 < this.#paddleWidth;
		if (!hitLeft) return;

		const hitPaddle =
			this.ballY + this.#ballSize / 2 > this.paddleAY - this.#paddleHeight / 2 &&
			this.ballY - this.#ballSize / 2 < this.paddleAY + this.#paddleHeight / 2;

		if (hitPaddle) {
			this.score++;

			this.ballX = this.#paddleWidth + this.#ballSize / 2;
			this.ballVX = -this.ballVX;

			// add random y velocity
			const randomY = Math.random() * this.#ballSpeed - this.#ballSpeed / 2;
			this.ballVY += randomY;
			return;
		}

		const outOfBounds = this.ballX + this.#ballSize / 2 < 0;
		if (outOfBounds) {
			this.gameOver();
		}
	}

	checkRightPaddleCollision() {
		const hitRight = this.ballX + this.#ballSize / 2 > this.width - this.#paddleWidth;
		if (!hitRight) return;

		const hitPaddle =
			this.ballY + this.#ballSize / 2 > this.paddleBY - this.#paddleHeight / 2 &&
			this.ballY - this.#ballSize / 2 < this.paddleBY + this.#paddleHeight / 2;

		if (hitPaddle) {
			this.ballX = this.width - this.#paddleWidth - this.#ballSize / 2;
			this.ballVX = -this.ballVX;

			// add random y velocity
			const randomY = Math.random() * this.#ballSpeed - this.#ballSpeed / 2;
			this.ballVY += randomY;
			return;
		}

		// right walls
		if (this.ballX + this.#ballSize / 2 > this.width) {
			this.ballX = this.width - this.#ballSize / 2;
			this.ballVX = -this.ballVX;
		}
	}

	checkBallCollision() {
		// top and bottom
		if (this.ballY - this.#ballSize / 2 < 0) {
			this.ballY = this.#ballSize / 2;
			this.ballVY = -this.ballVY;
		} else if (this.ballY + this.#ballSize / 2 > this.#height) {
			this.ballY = this.#height - this.#ballSize / 2;
			this.ballVY = -this.ballVY;
		}

		// right paddle
		this.checkRightPaddleCollision();

		// left paddle
		this.checkLeftPaddleCollision();
	}

	resetBall() {
		this.ballX = this.width / 2;
		this.ballY = this.#height / 2;
		this.ballVX = this.#ballSpeed / 2;
		this.ballVY = this.#ballSpeed / 2;
	}

	loop(delta: number) {
		if (this.isGameOver) return;
		if (this.state !== 'running') return;

		this.ballX += this.ballVX * delta;
		this.ballY += this.ballVY * delta;

		if (keyListener.isPressed('ArrowUp') || keyListener.isPressed('w')) {
			this.paddleYUp(delta);
		}
		if (keyListener.isPressed('ArrowDown') || keyListener.isPressed('s')) {
			this.paddleYDown(delta);
		}
		this.checkBallCollision();
		this.adjustAIPaddle(delta);
	}

	connectedCallback(): void {
		super.connectedCallback();
	}

	firstUpdated(changedProperties: PropertyValues) {
		super.firstUpdated(changedProperties);

		this.#subscriptions.push(keyListener.on('Escape', () => this.exit()));
		this.#subscriptions.push(keyListener.on(' ', () => this.restart()));
		this.#subscriptions.push(
			observeSize(this.shadowRoot?.host as HTMLElement, rect => {
				this.width = rect.width;
			}),
		);

		let lastTime: number | null = null;
		const frame = (time: number) => {
			if (lastTime !== null) {
				const delta = (time - lastTime) / 16.6667; // assuming 60fps
				this.loop(delta);
			}
			lastTime = time;
			requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
	}

	unsubscribeAll() {
		for (const unsub of this.#subscriptions) {
			unsub();
		}
		this.#subscriptions = [];
	}

	renderOverlay() {
		if (this.state === 'initial') {
			return html`
				<div>
					<span>Press Space to start the game</span>
					<br />
					Highscore: ${this.highscore}
				</div>
			`;
		}
		if (!this.isGameOver)
			return html`
			<div class='score'>
				${this.score}
			</div>`;
		return html`
			<div>
				<span class="game-over">Game Over!</span>
				<br />
				Score: ${this.score} | Highscore: ${this.highscore}
				<br />
				${this.state === 'running' ? 'Press ESC to exit or Space to restart' : ''}
			</div>
		`;
	}

	render() {
		return html`
			<style>
				:host {
					--height: ${this.#height}px;
				}
			</style>
			<div class="controls">
				Controls: <span class="key pixel-corners">W</span><span class="key pixel-corners">S</span> / <span class="key pixel-corners">↑</span><span class="key pixel-corners">↓</span> to move, <span class="key pixel-corners">ESC</span> to exit
			</div>
			<div class="pong">
				<svg width="100%" height="100%">
				${svg`
					<rect
						x="0"
						y="${this.paddleAY - this.#paddleHeight / 2}"
						width="${this.#paddleWidth}"
						height="${this.#paddleHeight}"
						fill="white"
					></rect>
					<rect
						x="${this.width - this.#paddleWidth}"
						y="${this.paddleBY - this.#paddleHeight / 2}"
						width="${this.#paddleWidth}"
						height="${this.#paddleHeight}"
						fill="white"
					></rect>
					${
						!this.isGameOver
							? svg`
								<circle cx="${this.ballX}" cy="${this.ballY}" r="${this.#ballSize / 2}" fill="white"></circle>
								`
							: ''
					}
					`}
				</svg>
				<div class="overlay">
					${this.renderOverlay()}
				</div>
			</div>
		`;
	}
}

customElements.define('mh-terminal-pong', PongComponent);

class PongCommand implements Command {
	name = 'pong';
	description = 'Play a game of pong';
	prepare(terminal: Terminal): TerminalFunction {
		return () => {
			terminal.disableInput();
			return [component(html`<mh-terminal-pong .terminal=${terminal}></mh-terminal-pong>`)];
		};
	}
}

const pong: Command = new PongCommand();

export default pong;
