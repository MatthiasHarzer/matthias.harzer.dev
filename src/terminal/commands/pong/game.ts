import { keyListener } from '../../../services/hotkey-listener.ts';
import { ReactiveObject } from '../../../services/reactive-object.ts';
import { SinglePlayerStrategy } from './strategies.ts';

interface Vector2 {
	x: number;
	y: number;
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
	phase: 'initial' | 'running' | 'point-scored' | 'game-over';
}

interface GameConfig {
	mode: 'single-player' | 'two-player';
	field: { width: number; height: number };
	paddle: { width: number; height: number; speed: number };
	ball: { size: number; speed: number };
	pointsToWin: number;
}

abstract class GameStrategy {
	readonly game: PongGame;

	constructor(game: PongGame) {
		this.game = game;
	}

	get state() {
		return this.game.state;
	}

	get config() {
		return this.game.config;
	}

	abstract resetBall(): void;
	abstract tick(deltaTime: number): void;
	abstract continue(): void;
}

class PongGame {
	readonly state: ReactiveObject<GameState>;
	readonly config: ReactiveObject<GameConfig>;
	readonly strategy: GameStrategy;

	constructor(config: GameConfig) {
		this.state = new ReactiveObject<GameState>({
			playerLeft: { position: { x: 0, y: 0 }, score: 0 },
			playerRight: { position: { x: 0, y: 0 }, score: 0 },
			ball: {
				position: { x: 0, y: 0 },
				velocity: { x: config.ball.speed / 2, y: config.ball.speed / 2 },
			},
			phase: 'initial',
		});
		// TODO: move?
		this.config = new ReactiveObject<GameConfig>(config);

		keyListener.on(' ', () => {
			this.strategy.continue();
		});

		switch (config.mode) {
			case 'single-player':
				this.strategy = new SinglePlayerStrategy(this);
				break;
			case 'two-player':
				throw new Error('Two-player mode not implemented yet');
		}

		this.setup();
	}

	get $state() {
		return this.state.$;
	}

	get has2ndPlayer() {
		return this.config.$.mode === 'two-player';
	}

	setup() {
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
		this.state.$.ball.velocity.x = -this.state.$.ball.velocity.x;
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
}

export { GameStrategy, PongGame };
export type { GameConfig, GameState };
