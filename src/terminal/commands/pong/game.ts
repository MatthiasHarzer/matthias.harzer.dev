import { keyListener } from '../../../services/hotkey-listener.ts';
import { random } from '../../../services/random.ts';
import {
	Observable,
	type ReadOnlyObservable,
	type Unsubscribe,
} from '../../../services/reactive.ts';
import { ReactiveObject } from '../../../services/reactive-object.ts';
import { type GameStrategy, LocalTwoPlayerStrategy, SinglePlayerStrategy } from './strategies.ts';

interface Vector2 {
	x: number;
	y: number;
}

type Phase = 'initial' | 'running' | 'point-scored' | 'game-over' | 'stopped';

interface GameConfig {
	field: { width: number; height: number };
	paddle: { width: number; height: number; speed: number };
	ball: { size: number; speed: number };
	pointsToWin: number;
}

interface GameState {
	playerLeft: {
		position: Vector2;
		score: number;
	};
	playerRight: {
		position: Vector2;
		score: number;
	};
	ball: {
		position: Vector2;
		velocity: Vector2;
	};
	phase: Phase;
}

type Mode = 'single-player' | 'two-player';

class PongGame {
	readonly state: ReactiveObject<GameState>;
	readonly config: ReactiveObject<GameConfig>;
	readonly strategy: GameStrategy;
	readonly mode: Mode;
	private readonly _phase = new Observable<Phase>('initial');
	private readonly subscriptions: Unsubscribe[] = [];

	get phase(): ReadOnlyObservable<Phase> {
		return this._phase;
	}

	constructor(mode: Mode, config: ReactiveObject<GameConfig>) {
		this.state = new ReactiveObject<GameState>({
			playerLeft: { position: { x: 0, y: 0 }, score: 0 },
			playerRight: { position: { x: 0, y: 0 }, score: 0 },
			ball: {
				position: { x: 0, y: 0 },
				velocity: { x: 0, y: 0 },
			},
			phase: 'initial',
		});
		this.config = config;
		this.mode = mode;
		this.state.subscribe(() => {
			this._phase.set(this.state.$.phase);
		}, false);

		this.subscriptions.push(
			keyListener.on(' ', () => {
				this.strategy.continue();
			}),
		);
		this.subscriptions.push(
			keyListener.on('Escape', () => {
				this.state.$.phase = 'stopped';
			}),
		);

		switch (mode) {
			case 'single-player':
				this.strategy = new SinglePlayerStrategy(this);
				break;
			case 'two-player':
				this.strategy = new LocalTwoPlayerStrategy(this);
				break;
			default:
				throw new Error(`Unknown mode "${mode}"`);
		}
	}

	get has2ndPlayer() {
		return this.mode === 'two-player';
	}

	setup() {
		this.strategy.setup();

		let lastTime: number | null = null;
		const frame = (time: number) => {
			if (lastTime !== null) {
				const delta = (time - lastTime) / 16.6667; // assuming 60fps
				this.strategy.tick(delta);
			}
			lastTime = time;
			requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
	}

	moveBall(delta: number) {
		this.state.$.ball.position.x += this.state.$.ball.velocity.x * delta;
		this.state.$.ball.position.y += this.state.$.ball.velocity.y * delta;
	}

	tickBallYReflection() {
		if (this.state.$.ball.position.y - this.config.$.ball.size / 2 < 0) {
			this.state.$.ball.position.y = this.config.$.ball.size / 2;
			this.state.$.ball.velocity.y = -this.state.$.ball.velocity.y;
		} else if (
			this.state.$.ball.position.y + this.config.$.ball.size / 2 >
			this.config.$.field.height
		) {
			this.state.$.ball.position.y = this.config.$.field.height - this.config.$.ball.size / 2;
			this.state.$.ball.velocity.y = -this.state.$.ball.velocity.y;
		}
	}

	reflectBallX() {
		const randomYSpeedOffset = random(-this.config.$.ball.speed / 4, this.config.$.ball.speed / 4);
		const ySpeed = this.config.$.ball.speed / 2 + randomYSpeedOffset;

		this.state.$.ball.velocity.x = -this.state.$.ball.velocity.x;
		this.state.$.ball.velocity.y = ySpeed * Math.sign(this.state.$.ball.velocity.y);
	}

	paddleYUp(current: number, delta: number) {
		current -= this.config.$.paddle.speed * delta;
		if (current - this.config.$.paddle.height / 2 < 0) {
			current = this.config.$.paddle.height / 2;
		}
		return current;
	}

	paddleYDown(current: number, delta: number) {
		current += this.config.$.paddle.speed * delta;
		if (current + this.config.$.paddle.height / 2 > this.config.$.field.height) {
			current = this.config.$.field.height - this.config.$.paddle.height / 2;
		}
		return current;
	}

	paddleLeftYUp(delta: number) {
		this.state.$.playerLeft.position.y = this.paddleYUp(this.state.$.playerLeft.position.y, delta);
	}

	paddleLeftYDown(delta: number) {
		this.state.$.playerLeft.position.y = this.paddleYDown(
			this.state.$.playerLeft.position.y,
			delta,
		);
	}

	paddleRightYUp(delta: number) {
		this.state.$.playerRight.position.y = this.paddleYUp(
			this.state.$.playerRight.position.y,
			delta,
		);
	}

	paddleRightYDown(delta: number) {
		this.state.$.playerRight.position.y = this.paddleYDown(
			this.state.$.playerRight.position.y,
			delta,
		);
	}

	hasHitLeftPaddle() {
		return (
			this.state.$.ball.position.x - this.config.$.ball.size / 2 < this.config.$.paddle.width &&
			this.state.$.ball.position.y + this.config.$.ball.size / 2 >
				this.state.$.playerLeft.position.y - this.config.$.paddle.height / 2 &&
			this.state.$.ball.position.y - this.config.$.ball.size / 2 <
				this.state.$.playerLeft.position.y + this.config.$.paddle.height / 2
		);
	}

	hasHitRightPaddle() {
		return (
			this.state.$.ball.position.x + this.config.$.ball.size / 2 >
				this.config.$.field.width - this.config.$.paddle.width &&
			this.state.$.ball.position.y + this.config.$.ball.size / 2 >
				this.state.$.playerRight.position.y - this.config.$.paddle.height / 2 &&
			this.state.$.ball.position.y - this.config.$.ball.size / 2 <
				this.state.$.playerRight.position.y + this.config.$.paddle.height / 2
		);
	}

	isOutOfBoundsLeft() {
		return this.state.$.ball.position.x + this.config.$.ball.size / 2 < 0;
	}

	isOutOfBoundsRight() {
		return this.state.$.ball.position.x - this.config.$.ball.size / 2 > this.config.$.field.width;
	}

	dispose() {
		for (const unsubscribe of this.subscriptions) {
			unsubscribe();
		}
	}
}

export { PongGame };
export type { GameConfig, GameState };
