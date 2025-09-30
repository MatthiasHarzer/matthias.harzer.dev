import { keyListener } from '../../../services/hotkey-listener.ts';
import { ReactiveObject } from '../../../services/reactive-object.ts';
import {
	Observable,
	type ReadOnlyObservable,
	type Unsubscribe,
} from '../../../services/reactive.ts';
import type { Vector2 } from '../../games/components.ts';

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

class SnakeGame {
	readonly config: ReactiveObject<SnakeGameConfig>;
	readonly state: ReactiveObject<SnakeGameState>;
	private readonly _phase = new Observable<Phase>('initial');
	private readonly subscriptions: Unsubscribe[] = [];
	nextDirection: Direction | null = null;

	get head() {
		return this.state.$.snake[0];
	}

	get phase(): ReadOnlyObservable<Phase> {
		return this._phase;
	}

	constructor(config: ReactiveObject<SnakeGameConfig>) {
		this.config = config;
		this.state = new ReactiveObject<SnakeGameState>({
			snake: [],
			food: { x: -2, y: -2 },
			phase: 'initial',
			score: 0,
		});
		this.resetSnake();

		this.subscriptions.push(keyListener.on(' ', () => this.continue()));
		this.subscriptions.push(keyListener.on('Escape', () => this.exit()));
		this.subscriptions.push(
			this.state.subscribe(() => {
				this._phase.set(this.state.$.phase);
			}, false),
		);

		this.setup();
	}

	placeNextFood() {
		let newFoodPosition: Vector2;
		do {
			newFoodPosition = {
				x: Math.floor(Math.random() * this.config.$.blocksWidth),
				y: Math.floor(Math.random() * this.config.$.blocksHeight),
			};
		} while (
			this.state.$.snake.some(
				part => part.position.x === newFoodPosition.x && part.position.y === newFoodPosition.y,
			)
		);
		this.state.$.food = newFoodPosition;
	}

	movePart(part: SnakePart) {
		switch (part.direction) {
			case 'up':
				part.position.y -= 1;
				break;
			case 'down':
				part.position.y += 1;
				break;
			case 'left':
				part.position.x -= 1;
				break;
			case 'right':
				part.position.x += 1;
				break;
		}
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
		if (keyListener.isPressed('ArrowUp') || keyListener.isPressed('w')) {
			this.changeDirection('up');
		} else if (keyListener.isPressed('ArrowDown') || keyListener.isPressed('s')) {
			this.changeDirection('down');
		} else if (keyListener.isPressed('ArrowLeft') || keyListener.isPressed('a')) {
			this.changeDirection('left');
		} else if (keyListener.isPressed('ArrowRight') || keyListener.isPressed('d')) {
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
		// Check food collision
		const headHitsFood =
			this.head.position.x === this.state.$.food.x && this.head.position.y === this.state.$.food.y;
		if (headHitsFood) {
			// Increase score
			this.state.$.score += 1;
			this.addSnakePart();
			this.placeNextFood();
		}

		// Check wall collisions
		const headHitWall =
			this.head.position.x < 0 ||
			this.head.position.x >= this.config.$.blocksWidth ||
			this.head.position.y < 0 ||
			this.head.position.y >= this.config.$.blocksHeight;
		if (headHitWall) {
			this.gameOver();
			return;
		}

		const headHitBody = this.state.$.snake.slice(1).some(part => {
			return part.position.x === this.head.position.x && part.position.y === this.head.position.y;
		});
		if (headHitBody) {
			this.gameOver();
			return;
		}
	}

	loop(_: number) {
		if (this.state.$.phase !== 'running') return;

		this.applyDirection(this.nextDirection);
		this.nextDirection = null;

		// Move body parts
		for (let i = this.state.$.snake.length - 1; i > 0; i--) {
			const previousPart = this.state.$.snake[i - 1];
			this.state.$.snake[i].position = { ...previousPart.position };
			this.state.$.snake[i].direction = previousPart.direction;
		}
		this.movePart(this.head);
		this.checkCollisions();
	}

	setup() {
		let lastTime: number | null = null;
		const interval = 1000 / this.config.$.fps;
		const frame = (time: number) => {
			if (!lastTime) {
				lastTime = time;
			}

			this.handleInput();

			const deltaTime = time - lastTime;
			if (deltaTime >= interval) {
				this.loop(deltaTime);
				lastTime = time;
			}
			requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
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

	dispose() {
		for (const unsubscribe of this.subscriptions) {
			unsubscribe();
		}
		this.state.disconnect();
	}
}

export { SnakeGame };
export type { Direction, Phase, SnakeGameConfig, SnakeGameState };
