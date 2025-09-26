import { css, html, type PropertyValues, svg } from 'lit';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';
import { Component } from '../../../litutil/Component.ts';
import { keyListener } from '../../../services/hotkey-listener.ts';
import type { Unsubscribe } from '../../../services/reactive.ts';
import { observeSize } from '../../../services/size.ts';
import type { Terminal } from '../../../Terminal.ts';
import {
	type Command,
	component,
	indentation,
	linebreak,
	mentionCommandName,
	type TerminalFunction,
	text,
} from '../../terminal.ts';

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

	#paddleHeight: number = 50;
	#paddleWidth: number = 10;
	#ballSize: number = 10;
	#height: number = 300;
	#paddleSpeed: number = 5;
	#ballSpeed: number = 10;
	#scoreToWin: number = 5;
	#localStorageKey: string = 'terminal-pong-highscore';

	@property({ attribute: false }) terminal: Terminal | null = null;
	@property({ type: Boolean, attribute: 'enable-2nd-player' }) enable2ndPlayer = false;

	@state() width = 300;
	@state() ballX: number = 150;
	@state() ballY: number = 150;
	@state() ballVX: number = this.#ballSpeed / 2;
	@state() ballVY: number = this.#ballSpeed / 2;
	@state() paddleLeftY: number = 150;
	@state() paddleRightY: number = 150;
	@state() scoreLeft: number = 0;
	@state() scoreRight: number = 0;
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
	@state() state: 'initial' | 'running' | 'paused' | 'game-over' | 'stopped' = 'initial';

	#subscriptions: Unsubscribe[] = [];

	get has2ndPlayer() {
		return this.enable2ndPlayer;
	}

	continue() {
		switch (this.state) {
			case 'initial':
			case 'game-over':
				this.scoreLeft = 0;
				this.scoreRight = 0;
		}
		switch (this.state) {
			case 'initial':
			case 'game-over':
			case 'paused':
				this.state = 'running';
				this.resetBall();
				break;
		}
	}

	exit() {
		this.state = 'stopped';
		this.terminal?.enableInput().then(() => {
			this.terminal?.focusInput();
		});
		this.unsubscribeAll();
	}

	paddleYUp(current: number, delta: number) {
		current -= this.#paddleSpeed * delta;
		if (current - this.#paddleHeight / 2 < 0) {
			current = this.#paddleHeight / 2;
		}
		return current;
	}

	paddleYDown(current: number, delta: number) {
		current += this.#paddleSpeed * delta;
		if (current + this.#paddleHeight / 2 > this.#height) {
			current = this.#height - this.#paddleHeight / 2;
		}
		return current;
	}

	paddleLeftYUp(delta: number) {
		this.paddleLeftY = this.paddleYUp(this.paddleLeftY, delta);
	}

	paddleLeftYDown(delta: number) {
		this.paddleLeftY = this.paddleYDown(this.paddleLeftY, delta);
	}

	paddleRightYUp(delta: number) {
		this.paddleRightY = this.paddleYUp(this.paddleRightY, delta);
	}

	paddleRightYDown(delta: number) {
		this.paddleRightY = this.paddleYDown(this.paddleRightY, delta);
	}

	adjustAIPaddle(delta: number) {
		// calculate the target position where the ball will hit the right paddle
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
		if (this.paddleRightY < targetY - 10) {
			this.paddleRightY += this.#paddleSpeed * delta;
		} else if (this.paddleRightY > targetY + 10) {
			this.paddleRightY -= this.#paddleSpeed * delta;
		}

		// clamp the paddle position within the game area
		if (this.paddleRightY - this.#paddleHeight / 2 < 0) {
			this.paddleRightY = this.#paddleHeight / 2;
		} else if (this.paddleRightY + this.#paddleHeight / 2 > this.#height) {
			this.paddleRightY = this.#height - this.#paddleHeight / 2;
		}
	}

	gameOver() {
		this.state = 'game-over';
		if (this.scoreLeft > this.highscore) {
			this.highscore = this.scoreLeft;
		}
	}

	scorePoint(side: 'left' | 'right') {
		if (!this.has2ndPlayer) {
			this.gameOver();
			return;
		}

		if (side === 'left') {
			this.scoreLeft++;
		} else {
			this.scoreRight++;
		}

		if (this.scoreLeft >= this.#scoreToWin || this.scoreRight >= this.#scoreToWin) {
			this.gameOver();
			return;
		}

		this.state = 'paused';
		this.resetBall();
	}

	checkLeftSideCollision() {
		const hitLeft = this.ballX - this.#ballSize / 2 < this.#paddleWidth;
		if (!hitLeft) return;

		const hitPaddle =
			this.ballY + this.#ballSize / 2 > this.paddleLeftY - this.#paddleHeight / 2 &&
			this.ballY - this.#ballSize / 2 < this.paddleLeftY + this.#paddleHeight / 2;

		if (hitPaddle) {
			if (!this.has2ndPlayer) {
				// increase score for single player mode
				this.scoreLeft++;
			}

			this.ballX = this.#paddleWidth + this.#ballSize / 2;
			this.ballVX = -this.ballVX;

			// add random y velocity
			const randomY = Math.random() * this.#ballSpeed - this.#ballSpeed / 2;
			this.ballVY += randomY;
			return;
		}

		const outOfBounds = this.ballX + this.#ballSize / 2 < 0;
		if (outOfBounds) {
			// If the ball is out of bounds on the left side, the right player scores
			this.scorePoint('right');
		}
	}

	checkRightCollision() {
		const hitRight = this.ballX + this.#ballSize / 2 > this.width - this.#paddleWidth;
		if (!hitRight) return;

		const hitPaddle =
			this.ballY + this.#ballSize / 2 > this.paddleRightY - this.#paddleHeight / 2 &&
			this.ballY - this.#ballSize / 2 < this.paddleRightY + this.#paddleHeight / 2;

		if (hitPaddle) {
			this.ballX = this.width - this.#paddleWidth - this.#ballSize / 2;
			this.ballVX = -this.ballVX;

			// add random y velocity
			const randomY = Math.random() * this.#ballSpeed - this.#ballSpeed / 2;
			this.ballVY += randomY;
			return;
		}

		const outOfBounds = this.ballX - this.#ballSize / 2 > this.width;
		if (!this.has2ndPlayer && outOfBounds) {
			this.ballX = this.width - this.#ballSize / 2;
			this.ballVX = -this.ballVX;
			return;
		}
		if (this.has2ndPlayer && outOfBounds) {
			// If the ball is out of bounds on the right side, the left player scores
			this.scorePoint('left');
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
		this.checkRightCollision();

		// left paddle
		this.checkLeftSideCollision();
	}

	resetBall() {
		if (this.has2ndPlayer) {
			if (Math.random() < 0.5) {
				// Spawn towards left player
				this.ballX = this.#paddleWidth + this.#ballSize;
				this.ballY = this.#height / 2;
				this.ballVX = this.#ballSpeed / 2;
				this.ballVY = this.#ballSpeed / 2;
			} else {
				// Spawn towards right player
				this.ballX = this.width - this.#paddleWidth - this.#ballSize;
				this.ballY = this.#height / 2;
				this.ballVX = -this.#ballSpeed / 2;
				this.ballVY = this.#ballSpeed / 2;
			}
			return;
		}
		this.ballX = this.width / 2;
		this.ballY = this.#height / 2;
		this.ballVX = this.#ballSpeed / 2;
		this.ballVY = this.#ballSpeed / 2;
	}

	loop(delta: number) {
		if (this.state !== 'running') return;

		this.ballX += this.ballVX * delta;
		this.ballY += this.ballVY * delta;

		this.checkBallCollision();

		if (!this.has2ndPlayer) {
			this.adjustAIPaddle(delta);

			if (keyListener.isPressed('ArrowUp') || keyListener.isPressed('w')) {
				this.paddleLeftYUp(delta);
			}
			if (keyListener.isPressed('ArrowDown') || keyListener.isPressed('s')) {
				this.paddleLeftYDown(delta);
			}
			return;
		}

		if (keyListener.isPressed('ArrowDown')) {
			this.paddleRightYDown(delta);
		}
		if (keyListener.isPressed('ArrowUp')) {
			this.paddleRightYUp(delta);
		}

		if (keyListener.isPressed('s')) {
			this.paddleLeftYDown(delta);
		}
		if (keyListener.isPressed('w')) {
			this.paddleLeftYUp(delta);
		}
	}

	connectedCallback(): void {
		super.connectedCallback();
	}

	firstUpdated(changedProperties: PropertyValues) {
		super.firstUpdated(changedProperties);

		this.#subscriptions.push(keyListener.on('Escape', () => this.exit()));
		this.#subscriptions.push(keyListener.on(' ', () => this.continue()));
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
		switch (this.state) {
			case 'initial':
				return html`
					<div>
						<span>Press Space to start the game</span>
						<br />
						Highscore: ${this.highscore}
					</div>
				`;
			case 'running': {
				if (this.has2ndPlayer) {
					return html`
					<div class='score'>
						${this.scoreLeft} : ${this.scoreRight}
					</div>
				`;
				}
				return html`
					<div class='score'>
						${this.scoreLeft}
					</div>
				`;
			}
			case 'paused':
				return html`
					<div>
						<span>${this.scoreLeft} : ${this.scoreRight}</span>
						<br />
						Press Space to continue
					</div>
				`;
			case 'game-over':
			case 'stopped': {
				if (this.has2ndPlayer) {
					let winnerText = '';
					if (this.scoreLeft > this.scoreRight) {
						winnerText = 'Left Player Wins!';
					} else if (this.scoreRight > this.scoreLeft) {
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
						${this.scoreLeft} : ${this.scoreRight}
						<br />
						${this.state === 'game-over' ? 'Press ESC to exit or Space to restart' : ''}
					</div>
				`;
				}
				return html`
					<div>
						<span class="game-over">Game Over!</span>
						<br />
						Score: ${this.scoreLeft} | Highscore: ${this.highscore}
						<br />
						${this.state === 'game-over' ? 'Press ESC to exit or Space to restart' : ''}
					</div>
				`;
			}
		}
	}

	renderGame() {
		return html`
			<svg width="100%" height="100%">
				${svg`
					<rect
						x="0"
						y="${this.paddleLeftY - this.#paddleHeight / 2}"
						width="${this.#paddleWidth}"
						height="${this.#paddleHeight}"
						fill="white"
					></rect>
					<rect
						x="${this.width - this.#paddleWidth}"
						y="${this.paddleRightY - this.#paddleHeight / 2}"
						width="${this.#paddleWidth}"
						height="${this.#paddleHeight}"
						fill="white"
					></rect>
					${
						this.state === 'running'
							? svg`
								<circle cx="${this.ballX}" cy="${this.ballY}" r="${this.#ballSize / 2}" fill="white"></circle>
								`
							: ''
					}
				`}
			</svg>
		`;
	}

	render() {
		return html`
			<style>
				:host {
					--height: ${this.#height}px;
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

class PongCommand implements Command {
	name = 'pong';
	description = 'Play a game of pong';
	prepare(terminal: Terminal): TerminalFunction {
		return (option: string = '') => {
			terminal.disableInput();
			const enable2ndPlayer = option.toLowerCase().trim() === 'vs';

			return [
				component(
					html`<mh-terminal-pong .terminal=${terminal} ?enable-2nd-player=${enable2ndPlayer}></mh-terminal-pong>`,
				),
			];
		};
	}
	provideHelpDetails(terminal: Terminal): TerminalFunction {
		return (...args: string[]) => {
			if (args.length === 0) {
				return [
					text(
						'Starts a game of pong inside the terminal. Optionally, you can play against a second player.',
					),
					linebreak(),
					text('Examples:'),
					linebreak(),
					indentation(2, [
						mentionCommandName(terminal, 'pong'),
						text(' - Starts a single player infinite game. Try to maximize your highscore!'),
						linebreak(),
						mentionCommandName(terminal, 'pong vs'),
						text(' - Starts a two player game. First to 5 points wins.'),
					]),
				];
			}
			switch (args[0].toLowerCase()) {
				case 'vs':
					return [
						text('Starts a game of pong against a second player.'),
						linebreak(1),
						text('Controls:'),
						linebreak(),
						indentation(2, [
							text('  Left Player: W/S'),
							linebreak(),
							text('  Right Player: Arrow Up/Down'),
						]),
						linebreak(1),
						text('First to 5 points wins.'),
					];
				default:
					return [text(`Unknown option "${args[0]}".`)];
			}
		};
	}
}

const pong: Command = new PongCommand();

export default pong;
