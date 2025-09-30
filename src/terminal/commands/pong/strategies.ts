import { keyListener } from '../../../services/hotkey-listener.ts';
import type { PongGame } from './game.ts';

abstract class GameStrategy {
	readonly game: PongGame;

	constructor(game: PongGame) {
		this.game = game;

		this.game.config.subscribe(() => this.resize(), false);
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

	resize() {
		this.state.$.playerRight.position.x = this.config.$.field.width - this.config.$.paddle.width;
	}

	setup() {
		this.state.$.playerLeft.position = {
			x: 0,
			y: this.config.$.field.height / 2,
		};
		this.state.$.playerRight.position = {
			x: this.config.$.field.width - this.config.$.paddle.width,
			y: this.config.$.field.height / 2,
		};
		this.state.$.playerLeft.score = 0;
		this.state.$.playerRight.score = 0;
		this.state.$.phase = 'initial';
		this.resetBall();
	}
}

class SinglePlayerStrategy extends GameStrategy {
	resetBall() {
		this.state.$.ball.position = {
			x: this.config.$.field.width / 2,
			y: this.config.$.field.height / 2,
		};
		this.state.$.ball.velocity = {
			x: this.config.$.ball.speed / 2,
			y: this.config.$.ball.speed / 2,
		};
	}

	adjustAIPaddle(deltaTime: number) {
		// calculate the target position where the ball will hit the right paddle
		const timeToReachPaddle =
			(this.config.$.field.width - this.state.$.ball.position.x) / this.state.$.ball.velocity.x;
		let targetY = this.state.$.ball.position.y + this.state.$.ball.velocity.y * timeToReachPaddle;

		// reflect off top and bottom walls
		while (targetY < 0 || targetY > this.config.$.field.height) {
			if (targetY < 0) {
				targetY = -targetY;
			} else if (targetY > this.config.$.field.height) {
				targetY = 2 * this.config.$.field.height - targetY;
			}
		}

		const deltaY = targetY - this.state.$.playerRight.position.y;
		const movingTowardsAiPlayer = this.state.$.ball.velocity.x > 0;

		// move the paddle smoothly towards the target position. If the ball is moving away, center the paddle.
		if (movingTowardsAiPlayer) {
			const moveAmount =
				Math.sign(deltaY) * Math.min(Math.abs(deltaY), this.config.$.paddle.speed * deltaTime);
			this.state.$.playerRight.position.y += moveAmount;
		} else {
			const centerY = this.config.$.field.height / 2;
			const centerDeltaY = centerY - this.state.$.playerRight.position.y;
			const moveAmount =
				Math.sign(centerDeltaY) *
				Math.min(Math.abs(centerDeltaY), this.config.$.paddle.speed * deltaTime);
			this.state.$.playerRight.position.y += moveAmount;
		}

		// clamp the paddle position within the game area
		if (this.state.$.playerRight.position.y - this.config.$.paddle.height / 2 < 0) {
			this.state.$.playerRight.position.y = this.config.$.paddle.height / 2;
		} else if (
			this.state.$.playerRight.position.y + this.config.$.paddle.height / 2 >
			this.config.$.field.height
		) {
			this.state.$.playerRight.position.y =
				this.config.$.field.height - this.config.$.paddle.height / 2;
		}
	}

	checkCollision() {
		if (this.game.isOutOfBoundsLeft()) {
			this.state.$.phase = 'game-over';
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
		if (this.state.$.phase !== 'running') {
			return;
		}

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

class LocalTwoPlayerStrategy extends GameStrategy {
	lastPlayerScored: 'left' | 'right' = 'right';

	resetBall() {
		switch (this.lastPlayerScored) {
			case 'left':
				this.state.$.ball.position = {
					x: this.config.$.field.width - this.config.$.paddle.width - this.config.$.ball.size,
					y: this.config.$.field.height / 2,
				};
				this.state.$.ball.velocity = {
					x: -this.config.$.ball.speed / 2,
					y: this.config.$.ball.speed / 2,
				};
				break;
			case 'right':
				this.state.$.ball.position = {
					x: this.config.$.paddle.width + this.config.$.ball.size,
					y: this.config.$.field.height / 2,
				};
				this.state.$.ball.velocity = {
					x: this.config.$.ball.speed / 2,
					y: this.config.$.ball.speed / 2,
				};
				break;
		}
	}

	checkCollision() {
		if (this.game.isOutOfBoundsLeft()) {
			this.state.$.phase = 'point-scored';
			this.lastPlayerScored = 'right';
			this.state.$.playerRight.score++;
			if (this.state.$.playerRight.score >= this.config.$.pointsToWin) {
				this.state.$.phase = 'game-over';
			}
			return;
		}

		if (this.game.isOutOfBoundsRight()) {
			this.state.$.phase = 'point-scored';
			this.lastPlayerScored = 'left';
			this.state.$.playerLeft.score++;
			if (this.state.$.playerLeft.score >= this.config.$.pointsToWin) {
				this.state.$.phase = 'game-over';
			}
			return;
		}

		if (this.game.hasHitRightPaddle() || this.game.hasHitLeftPaddle()) {
			this.game.reflectBallX();
			return;
		}
	}

	tick(deltaTime: number) {
		if (this.state.$.phase !== 'running') {
			return;
		}

		// Move ball
		this.game.moveBall(deltaTime);
		this.game.tickBallYReflection();

		if (keyListener.isPressed('w')) {
			this.game.paddleLeftYUp(deltaTime);
		}
		if (keyListener.isPressed('s')) {
			this.game.paddleLeftYDown(deltaTime);
		}
		if (keyListener.isPressed('ArrowUp')) {
			this.game.paddleRightYUp(deltaTime);
		}
		if (keyListener.isPressed('ArrowDown')) {
			this.game.paddleRightYDown(deltaTime);
		}

		this.checkCollision();
	}

	continue(): void {
		switch (this.state.$.phase) {
			case 'initial':
			case 'game-over':
			case 'point-scored':
				this.state.$.phase = 'running';
				this.resetBall();
				break;
		}
	}
}

export { LocalTwoPlayerStrategy, SinglePlayerStrategy };
export type { GameStrategy };
