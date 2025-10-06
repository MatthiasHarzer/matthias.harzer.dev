import { keylistener } from '../../../services/keylistener.ts';
import type { ReadOnlyObservable } from '../../../services/reactive.ts';
import type { ReactiveObject } from '../../../services/reactive-object.ts';
import type { Vector2 } from '../../games/components.ts';
import { TerminalGame } from '../../games/game.ts';

interface SnakeGameConfig {
	blockSize: number;
	blocksHeight: number;
	blocksWidth: number;
	fps: number;
}

type Direction = 'up' | 'down' | 'left' | 'right';

type Phase = 'initial' | 'running' | 'game-over' | 'stopped';

interface SnakePart {
	type: 'head' | 'body' | 'tail';
	direction: Direction;
	position: Vector2;
}

interface SnakeGameState {
	snake: SnakePart[];
	food: Vector2;
	phase: Phase;
	score: number;
}

const oppositeDirections: Record<Direction, Direction> = {
	up: 'down',
	down: 'up',
	left: 'right',
	right: 'left',
};

class SnakeGame extends TerminalGame<SnakeGameState, Phase> {
	protected nextDirection: Direction | null = null;
	protected deltaTimeAccumulator = 0;
	readonly config: ReactiveObject<SnakeGameConfig>;

	get head() {
		return this.state.$.snake[0];
	}

	get phase(): ReadOnlyObservable<Phase> {
		return this._phase;
	}

	get interval() {
		return this.baseFps / this.config.$.fps;
	}

	constructor(config: ReactiveObject<SnakeGameConfig>) {
		super({
			snake: [],
			food: { x: -2, y: -2 },
			phase: 'initial',
			score: 0,
		});
		this.config = config;
		this.resetSnake();

		this.subscriptions.push(keylistener.on(' ', () => this.continue()));
		this.subscriptions.push(keylistener.on('Escape', () => this.exit()));
		this.subscriptions.push(
			this.state.subscribe(() => {
				this._phase.set(this.state.$.phase);
			}, false),
		);
	}

	placeNextFood() {
		let newFoodPosition: Vector2;
		const positions = [
			...this.state.$.snake.map(part => part.position),
			this.nextPosition(this.head), // Include next head position to avoid spawning food there
		];
		do {
			newFoodPosition = {
				x: Math.floor(Math.random() * this.config.$.blocksWidth),
				y: Math.floor(Math.random() * this.config.$.blocksHeight),
			};
		} while (
			positions.some(
				position => position.x === newFoodPosition.x && position.y === newFoodPosition.y,
			)
		);
		this.state.$.food = newFoodPosition;
	}

	nextPosition(part: SnakePart): Vector2 {
		const position = { ...part.position };
		switch (part.direction) {
			case 'up':
				position.y -= 1;
				break;
			case 'down':
				position.y += 1;
				break;
			case 'left':
				position.x -= 1;
				break;
			case 'right':
				position.x += 1;
				break;
		}
		return position;
	}

	movePart(part: SnakePart) {
		part.position = this.nextPosition(part);
	}

	applyDirection(newDirection: Direction | null) {
		if (newDirection === null) return;
		const currentOpposite = oppositeDirections[this.head.direction];
		if (newDirection !== currentOpposite) {
			this.head.direction = newDirection;
		}
	}

	changeDirection(newDirection: Direction) {
		const currentOpposite = oppositeDirections[this.head.direction];
		if (newDirection !== currentOpposite) {
			this.nextDirection = newDirection;
		}
	}

	handleInput() {
		if (keylistener.isPressed('ArrowUp') || keylistener.isPressed('w')) {
			this.changeDirection('up');
		} else if (keylistener.isPressed('ArrowDown') || keylistener.isPressed('s')) {
			this.changeDirection('down');
		} else if (keylistener.isPressed('ArrowLeft') || keylistener.isPressed('a')) {
			this.changeDirection('left');
		} else if (keylistener.isPressed('ArrowRight') || keylistener.isPressed('d')) {
			this.changeDirection('right');
		}
	}

	addSnakePart() {
		const snake = this.state.$.snake;
		const tail = snake[snake.length - 1];

		// Update the old tail to be a body part
		tail.type = 'body';

		// Add new tail part
		this.state.$.snake.push({
			type: 'tail',
			direction: tail.direction,
			position: {
				x: -1,
				y: -1,
			},
		});
	}

	checkCollisions() {
		// Using a predicted head position to always keep the snake inside the bounds
		const nextHeadPosition = this.nextPosition(this.head);

		// Check food collision
		const willHitFood =
			nextHeadPosition.x === this.state.$.food.x && nextHeadPosition.y === this.state.$.food.y;

		if (willHitFood) {
			// Increase score
			this.state.$.score += 1;
			this.addSnakePart();
			this.placeNextFood();
		}

		// Check wall collisions
		const willHitWall =
			nextHeadPosition.x < 0 ||
			nextHeadPosition.x >= this.config.$.blocksWidth ||
			nextHeadPosition.y < 0 ||
			nextHeadPosition.y >= this.config.$.blocksHeight;
		if (willHitWall) {
			this.gameOver();
			return;
		}

		const willHitBody = this.state.$.snake.slice(1).some(part => {
			return part.position.x === nextHeadPosition.x && part.position.y === nextHeadPosition.y;
		});
		if (willHitBody) {
			this.gameOver();
			return;
		}
	}

	loop(_: number) {
		if (this.state.$.phase !== 'running') return;

		this.applyDirection(this.nextDirection);
		this.nextDirection = null;
		this.checkCollisions();

		if (this.state.$.phase !== 'running') return; // Exit if game over due to collision

		// Move body parts
		for (let i = this.state.$.snake.length - 1; i > 0; i--) {
			const previousPart = this.state.$.snake[i - 1];
			this.state.$.snake[i].position = { ...previousPart.position };
			this.state.$.snake[i].direction = previousPart.direction;
		}
		this.movePart(this.head);
	}

	tick(deltaTime: number): void {
		this.handleInput();
		this.deltaTimeAccumulator += deltaTime;
		if (this.deltaTimeAccumulator >= this.interval) {
			this.loop(this.deltaTimeAccumulator);
			this.deltaTimeAccumulator -= this.interval;
		}
	}

	resetSnake() {
		this.state.$.snake = [
			{ type: 'head', direction: 'right', position: { x: 5, y: 5 } },
			{ type: 'body', direction: 'right', position: { x: 4, y: 5 } },
			{ type: 'body', direction: 'right', position: { x: 3, y: 5 } },
			{ type: 'tail', direction: 'right', position: { x: 2, y: 5 } },
		];
	}

	continue() {
		switch (this.state.$.phase) {
			case 'initial':
				this.state.$.phase = 'running';
				this.placeNextFood();
				break;
			case 'game-over':
				this.resetSnake();
				this.state.$.phase = 'running';
				this.state.$.score = 0;
				this.nextDirection = null;
				this.placeNextFood();
				break;
		}
	}

	gameOver() {
		this.state.$.phase = 'game-over';
	}

	exit() {
		this.state.$.phase = 'stopped';
	}
}

export { SnakeGame };
export type { Direction, Phase, SnakeGameConfig, SnakeGameState };
