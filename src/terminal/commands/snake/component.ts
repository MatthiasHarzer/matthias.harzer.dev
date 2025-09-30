import { css, html, type PropertyValues, svg } from 'lit';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';
import { Component } from '../../../litutil/Component.ts';
import { ReactiveObject } from '../../../services/reactive-object.ts';
import type { Unsubscribe } from '../../../services/reactive.ts';
import type { Terminal } from '../../../Terminal.ts';
import { SnakeGame, type SnakeGameConfig } from './game.ts';

const BLOCK_SIZE = 15;
const MAX_HEIGHT = 300;
const BLOCKS_HEIGHT = Math.floor(MAX_HEIGHT / BLOCK_SIZE);
const FPS = 10;

class SnakeComponent extends Component {
	static styles = css`
		.snake {
			width: 100%;
			height: var(--height, 300px);

			background-color: transparent;
			display: flex;
			position: relative;
		}

		.tile {
			&.dark {
				fill: rgba(255, 255, 255, 0.05);
			}

			&.light {
				fill: rgba(255, 255, 255, 0.1);
			}
		}

		.snake-part {
			stroke: #333;

			&.head {
				fill: limegreen;
			}

			&.body {
				fill: green;
			}

			&.tail {
				fill: darkgreen;
			}
		}

		.food {
			fill: red;
			stroke: darkred;
		}
	`;

	@property({ attribute: false }) terminal: Terminal | null = null;
	subscriptions: Unsubscribe[] = [];
	config: ReactiveObject<SnakeGameConfig>;
	snakeGame: SnakeGame | null = null;
	localStorageKey: string = 'terminal-snake-highscore';

	@state()
	get highscore() {
		const stored = localStorage.getItem(this.localStorageKey);
		if (stored) {
			return parseInt(stored, 10);
		}
		return 0;
	}
	set highscore(value: number) {
		localStorage.setItem(this.localStorageKey, value.toString());
	}

	get game(): SnakeGame {
		if (!this.snakeGame) {
			throw new Error('Snake game not initialized');
		}
		return this.snakeGame;
	}

	get height() {
		return BLOCKS_HEIGHT * BLOCK_SIZE;
	}

	get blocksWidth() {
		return Math.floor((this.rect.width ?? 0) / BLOCK_SIZE);
	}

	get width() {
		return this.blocksWidth * BLOCK_SIZE;
	}

	constructor() {
		super();
		this.config = new ReactiveObject<SnakeGameConfig>({
			blockSize: BLOCK_SIZE,
			blocksWidth: this.blocksWidth,
			blocksHeight: BLOCKS_HEIGHT,
			fps: FPS,
		});
	}

	protected firstUpdated(_changedProperties: PropertyValues): void {
		super.firstUpdated(_changedProperties);

		if (!this.terminal) {
			throw new Error('Terminal not set');
		}

		this.snakeGame = new SnakeGame(this.config);

		const observer = new ResizeObserver(() => {
			this.config.$.blocksWidth = this.blocksWidth;
		});
		observer.observe(this.terminal);

		this.subscriptions.push(() => observer.disconnect());

		this.snakeGame.state.subscribeHost(this, false);
		this.snakeGame.config.subscribeHost(this, false);

		this.subscriptions.push(
			this.snakeGame.phase.subscribe(phase => {
				switch (phase) {
					case 'stopped':
					case 'game-over': {
						const score = this.snakeGame?.state.$.score || 0;
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
		for (const unsub of this.subscriptions) {
			unsub();
		}
		this.snakeGame?.dispose();
		this.subscriptions = [];
	}

	renderCheckerboard() {
		const rects = [] as unknown[];
		for (let y = 0; y < this.config.$.blocksHeight; y++) {
			for (let x = 0; x < this.config.$.blocksWidth; x++) {
				const isDark = (x + y) % 2 === 0;
				rects.push(svg`<rect
					x="${x * this.config.$.blockSize}"
					y="${y * this.config.$.blockSize}"
					width="${this.config.$.blockSize}"
					height="${this.config.$.blockSize}"
					class="tile ${isDark ? 'dark' : 'light'}"
				></rect>`);
			}
		}
		return svg`${rects}`;
	}

	renderGame() {
		const state = this.game.state.$;
		const config = this.game.config.$;

		return html`
			<svg
				width="100%" height="100%"
			>
				${this.renderCheckerboard()}
				${svg`
					${state.snake.map(
						part => svg`<rect
						x="${part.position.x * config.blockSize}"
						y="${part.position.y * config.blockSize}"
						width="${config.blockSize}"
						height="${config.blockSize}"
						class="snake-part ${part.type}"
					></rect>`,
					)}
				<rect
					x="${state.food.x * config.blockSize}"
					y="${state.food.y * config.blockSize}"
					width="${config.blockSize}"
					height="${config.blockSize}"
					class="food"
				></rect>
				`}
			</svg>
			`;
	}

	render() {
		if (!this.snakeGame) {
			return html`<div>Loading...</div>`;
		}
		return html`
			<style>
				:host {
					--height: ${this.height}px;
					--width: ${this.width}px;
				}
			</style>
			<div>Score: ${this.game.state.$.score}</div>
			<div class="snake">
				${this.renderGame()}
			</div>
		`;
	}
}

customElements.define('mh-terminal-snake', SnakeComponent);
