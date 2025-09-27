import { keyListener } from '../../../services/hotkey-listener.ts';
import { ReactiveObject } from '../../../services/reactive-object.ts';

interface Vector2 {
	x: number;
	y: number;
}

interface GameState {
	mode: 'single-player' | 'two-player';
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
	fieldWidth: number;
	fieldHeight: number;
	paddleWidth: number;
	paddleHeight: number;
	ballSize: number;
	ballSpeed: number;
	paddleSpeed: number;
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

class SinglePlayerStrategy extends GameStrategy {
	resetBall() {
		this.game.state.$.ball.position = { x: this.game.width / 2, y: this.game.height / 2 };
		this.game.state.$.ball.velocity = {
			x: this.game.config.ballSpeed,
			y: this.game.config.ballSpeed,
		};
	}

	adjustAIPaddle(delta: number) {
		// calculate the target position where the ball will hit the right paddle
		const timeToReachPaddle = (this.game.width - this.game.ballX) / this.game.ballVX;
		let targetY = this.game.ballY + this.game.ballVY * timeToReachPaddle;

		// reflect off top and bottom walls
		while (targetY < 0 || targetY > this.game.height) {
			if (targetY < 0) {
				targetY = -targetY;
			} else if (targetY > this.game.height) {
				targetY = 2 * this.game.height - targetY;
			}
		}

		// move the paddle towards the target position smoothly
		if (this.game.paddleRightY < targetY - 10) {
			this.game.paddleRightY += this.game.paddleSpeed * delta;
		} else if (this.game.paddleRightY > targetY + 10) {
			this.game.paddleRightY -= this.game.paddleSpeed * delta;
		}

		// clamp the paddle position within the game area
		if (this.game.paddleRightY - this.game.paddleHeight / 2 < 0) {
			this.game.paddleRightY = this.game.paddleHeight / 2;
		} else if (this.game.paddleRightY + this.game.paddleHeight / 2 > this.game.height) {
			this.game.paddleRightY = this.game.height - this.game.paddleHeight / 2;
		}
	}

	checkCollision() {
		if (this.game.isOutOfBoundsLeft()) {
			this.game.state.$.phase = 'game-over';
			return;
		}

		if (this.game.hasHitRightPaddle() || this.game.isOutOfBoundsRight()) {
			this.game.reflectBallX();
			return;
		}

		if (this.game.hasHitLeftPaddle()) {
			this.state.$.playerLeft.score++;
			this.game.reflectBallX();
		}
	}

	tick(deltaTime: number) {
		// Move ball
		this.game.moveBall(deltaTime);
		this.game.tickBallYReflection();

		this.adjustAIPaddle(deltaTime);

		if (keyListener.isPressed('w') || keyListener.isPressed('ArrowUp')) {
			this.game.paddleLeftYUp(deltaTime);
		}
		if (keyListener.isPressed('s') || keyListener.isPressed('ArrowDown')) {
			this.game.paddleLeftYDown(deltaTime);
		}

		this.checkCollision();
	}

	continue(): void {
		switch (this.state.$.phase) {
			case 'initial':
			case 'game-over':
				this.state.$.phase = 'running';
				this.resetBall();
				break;
		}
	}
}

class PongGame {
	readonly state: ReactiveObject<GameState>;
	readonly config: GameConfig;
	readonly strategy: GameStrategy;

	constructor(mode: 'single-player' | 'two-player', config: GameConfig) {
		this.state = new ReactiveObject<GameState>({
			mode,
			playerLeft: { position: { x: 0, y: 0 }, score: 0 },
			playerRight: { position: { x: 0, y: 0 }, score: 0 },
			ball: { position: { x: 0, y: 0 }, velocity: { x: 1, y: 1 } },
			phase: 'initial',
		});
		this.config = config;

		keyListener.on(' ', () => {
			this.strategy.continue();
		});

		switch (mode) {
			case 'single-player':
				this.strategy = new SinglePlayerStrategy(this);
				break;
			case 'two-player':
				throw new Error('Two-player mode not implemented yet');
		}

		this.setup();
	}

	get width() {
		return this.config.fieldWidth;
	}

	get height() {
		return this.config.fieldHeight;
	}

	get ballX() {
		return this.state.$.ball.position.x;
	}

	get ballY() {
		return this.state.$.ball.position.y;
	}

	get ballVX() {
		return this.state.$.ball.velocity.x;
	}

	get ballVY() {
		return this.state.$.ball.velocity.y;
	}

	get ballSize() {
		return this.config.ballSize;
	}

	get paddleWidth() {
		return this.config.paddleWidth;
	}

	get paddleHeight() {
		return this.config.paddleHeight;
	}

	get paddleLeftY() {
		return this.state.$.playerLeft.position.y;
	}

	set paddleLeftY(value: number) {
		this.state.$.playerLeft.position.y = value;
	}

	get paddleRightY() {
		return this.state.$.playerRight.position.y;
	}

	set paddleRightY(value: number) {
		this.state.$.playerRight.position.y = value;
	}

	get paddleSpeed() {
		return this.config.paddleSpeed;
	}

	get has2ndPlayer() {
		return this.state.value.mode === 'two-player';
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
		if (this.ballY - this.ballSize / 2 < 0) {
			this.state.$.ball.position.y = this.ballSize / 2;
			this.state.$.ball.velocity.y = -this.ballVX;
		} else if (this.ballY + this.ballSize / 2 > this.height) {
			this.state.$.ball.position.y = this.height - this.ballSize / 2;
			this.state.$.ball.velocity.y = -this.ballVY;
		}
	}

	reflectBallX() {
		this.state.$.ball.velocity.x = -this.state.$.ball.velocity.x;
	}

	paddleYUp(current: number, delta: number) {
		current -= this.paddleSpeed * delta;
		if (current - this.paddleHeight / 2 < 0) {
			current = this.paddleHeight / 2;
		}
		return current;
	}

	paddleYDown(current: number, delta: number) {
		current += this.paddleSpeed * delta;
		if (current + this.paddleHeight / 2 > this.height) {
			current = this.height - this.paddleHeight / 2;
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

	hasHitLeftPaddle() {
		return (
			this.ballX - this.ballSize / 2 < this.paddleWidth &&
			this.ballY + this.ballSize / 2 > this.paddleLeftY - this.paddleHeight / 2 &&
			this.ballY - this.ballSize / 2 < this.paddleLeftY + this.paddleHeight / 2
		);
	}

	hasHitRightPaddle() {
		return (
			this.ballX + this.ballSize / 2 > this.width - this.paddleWidth &&
			this.ballY + this.ballSize / 2 > this.paddleRightY - this.paddleHeight / 2 &&
			this.ballY - this.ballSize / 2 < this.paddleRightY + this.paddleHeight / 2
		);
	}

	isOutOfBoundsLeft() {
		return this.ballX + this.ballSize / 2 < 0;
	}

	isOutOfBoundsRight() {
		return this.ballX - this.ballSize / 2 > this.width;
	}
}

export { PongGame };
