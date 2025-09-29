import { keyListener } from '../../../services/hotkey-listener.ts';
import { GameStrategy } from './game.ts';

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

	adjustAIPaddle(delta: number) {
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

		// move the paddle towards the target position smoothly
		if (this.state.$.playerRight.position.y < targetY - 10) {
			this.state.$.playerRight.position.y += this.config.$.paddle.speed * delta;
		} else if (this.state.$.playerRight.position.y > targetY + 10) {
			this.state.$.playerRight.position.y -= this.config.$.paddle.speed * delta;
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

export { SinglePlayerStrategy };
