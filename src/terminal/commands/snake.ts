import { css, html, type PropertyValues, svg } from 'lit';
import { state } from 'lit/decorators/state.js';
import { Component } from '../../litutil/Component.ts';
import { keyListener } from '../../services/hotkey-listener.ts';
import { type Command, component } from '../terminal.ts';

interface Position {
	x: number;
	y: number;
}

type Direction = 'up' | 'down' | 'left' | 'right';

interface SnakePart {
	type: 'head' | 'body' | 'tail';
	direction: Direction;
	position: Position;
}

const BLOCK_SIZE = 20;
const MAX_HEIGHT = 300;
const BLOCKS_HEIGHT = Math.floor(MAX_HEIGHT / BLOCK_SIZE);
const FPS = 5;

class SnakeComponent extends Component {
	static styles = css`

	`;

	@state() snake: SnakePart[] = [
		{ type: 'head', direction: 'right', position: { x: 5, y: 5 } },
		{ type: 'body', direction: 'right', position: { x: 4, y: 5 } },
		{ type: 'body', direction: 'right', position: { x: 3, y: 5 } },
		{ type: 'tail', direction: 'right', position: { x: 2, y: 5 } },
	];
	@state() food: Position = { x: 10, y: 10 };
	@state() score = 0;
	@state() gameOver = false;

	virutalHeadPosition: Position = { x: 5, y: 5 };

	get height() {
		return BLOCKS_HEIGHT * BLOCK_SIZE;
	}

	get blocksWidth() {
		return Math.floor((this.rect.width ?? 0) / BLOCK_SIZE);
	}

	get width() {
		return this.blocksWidth * BLOCK_SIZE;
	}

	get head() {
		return this.snake[0];
	}

	changeDirection(newDirection: Direction) {
		if (this.gameOver) return;

		const oppositeDirections: Record<Direction, Direction> = {
			up: 'down',
			down: 'up',
			left: 'right',
			right: 'left',
		};

		if (newDirection !== oppositeDirections[this.head.direction]) {
			this.head.direction = newDirection;
		}
	}

	loop(deltaTime: number) {
		if (this.gameOver) return;

		// Move the snake
		const newHeadPosition = { ...this.head.position };
		switch (this.head.direction) {
			case 'up':
				newHeadPosition.y -= 1;
				break;
			case 'down':
				newHeadPosition.y += 1;
				break;
			case 'left':
				newHeadPosition.x -= 1;
				break;
			case 'right':
				newHeadPosition.x += 1;
				break;
		}

		// Check for collisions with walls
		if (
			newHeadPosition.x < 0 ||
			newHeadPosition.x >= this.blocksWidth ||
			newHeadPosition.y < 0 ||
			newHeadPosition.y >= BLOCKS_HEIGHT
		) {
			this.gameOver = true;
			return;
		}

		// Check for collisions with self
		if (
			this.snake.some(
				part => part.position.x === newHeadPosition.x && part.position.y === newHeadPosition.y,
			)
		) {
			this.gameOver = true;
			return;
		}

		// Move the snake parts
		for (let i = this.snake.length - 1; i > 0; i--) {
			this.snake[i].position = { ...this.snake[i - 1].position };
			this.snake[i].direction = this.snake[i - 1].direction;
		}
		this.head.position = newHeadPosition;

		// Check for food consumption
		if (newHeadPosition.x === this.food.x && newHeadPosition.y === this.food.y) {
			this.score += 1;
			// Add new part to the snake
			const tail = this.snake[this.snake.length - 1];
			const newPartPosition = { ...tail.position };
			switch (tail.direction) {
				case 'up':
					newPartPosition.y += 1;
					break;
				case 'down':
					newPartPosition.y -= 1;
					break;
				case 'left':
					newPartPosition.x += 1;
					break;
				case 'right':
					newPartPosition.x -= 1;
					break;
			}
			this.snake.push({ type: 'tail', direction: tail.direction, position: newPartPosition });

			// Place new food
			this.placeFood();
		}

		this.requestUpdate();
	}

	placeFood() {
		let newFoodPosition: Position;
		do {
			newFoodPosition = {
				x: Math.floor(Math.random() * this.blocksWidth),
				y: Math.floor(Math.random() * BLOCKS_HEIGHT),
			};
		} while (
			this.snake.some(
				part => part.position.x === newFoodPosition.x && part.position.y === newFoodPosition.y,
			)
		);
		this.food = newFoodPosition;
	}

	setupLoop() {
		let lastTime: number | null = null;
		const interval = 1000 / FPS;
		const frame = (time: number) => {
			if (!lastTime) {
				lastTime = time;
			}
			const deltaTime = time - lastTime;
			if (deltaTime >= interval) {
				this.loop(deltaTime);
				lastTime = time;
			}
			requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
	}

	protected firstUpdated(_changedProperties: PropertyValues): void {
		super.firstUpdated(_changedProperties);

		keyListener.on('ArrowUp', () => this.changeDirection('up'));
		keyListener.on('ArrowDown', () => this.changeDirection('down'));
		keyListener.on('ArrowLeft', () => this.changeDirection('left'));
		keyListener.on('ArrowRight', () => this.changeDirection('right'));

		this.placeFood();
		this.setupLoop();
	}

	render() {
		return html`
			<svg
				width="${this.width}"
				height="${this.height}"
				style="border: 1px solid black; background-color: #f0f0f0;"
			>
				${svg`
					${this.snake.map(
						part => svg`<rect
						x="${part.position.x * BLOCK_SIZE}"
						y="${part.position.y * BLOCK_SIZE}"
						width="${BLOCK_SIZE}"
						height="${BLOCK_SIZE}"
						fill="${part.type === 'head' ? 'green' : 'lightgreen'}"
						stroke="darkgreen"
					></rect>`,
					)}
				<rect
					x="${this.food.x * BLOCK_SIZE}"
					y="${this.food.y * BLOCK_SIZE}"
					width="${BLOCK_SIZE}"
					height="${BLOCK_SIZE}"
					fill="red"
					stroke="darkred"
				></rect>
				`}
			</svg>
			<div>Score: ${this.score}</div>
			`;
	}
}

customElements.define('mh-terminal-snake', SnakeComponent);

const snake: Command = {
	name: 'snake',
	description: 'Play a game of Snake',
	prepare(terminal) {
		return () => {
			terminal.disableInput();
			return [component(html`<mh-terminal-snake></mh-terminal-snake>`)];
		};
	},
};

export default snake;
