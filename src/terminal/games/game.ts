import { Observable, type ReadOnlyObservable, type Unsubscribe } from '../../services/reactive.ts';
import { ReactiveObject } from '../../services/reactive-object.ts';

interface GameState<TPhase extends string> {
	phase: TPhase;
}

abstract class TerminalGame<TState extends GameState<TPhase>, TPhase extends string> {
	protected readonly subscriptions: Unsubscribe[] = [];
	protected animationFrameId: number | null = null;
	protected _phase: Observable<TPhase>;
	readonly state: ReactiveObject<TState>;

	get phase(): ReadOnlyObservable<TPhase> {
		return this._phase;
	}

	constructor(initialState: TState) {
		this.state = new ReactiveObject<TState>(initialState);

		this._phase = new Observable<TPhase>(initialState.phase);

		this.subscriptions.push(() => this._phase.disconnect());
		this.state.subscribe(() => {
			this._phase.set(this.state.$.phase);
		}, false);

		this.setup();
	}

	abstract tick(deltaTime: number): void;

	protected setup(): void {
		let lastTime: number | null = null;

		const frame = (time: number) => {
			if (lastTime !== null) {
				const deltaTime = time - lastTime;
				this.tick(deltaTime);
			}
			lastTime = time;
			this.animationFrameId = requestAnimationFrame(frame);
		};

		this.animationFrameId = requestAnimationFrame(frame);
	}

	dispose(): void {
		for (const unsubscribe of this.subscriptions) {
			unsubscribe();
		}

		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		this.state.disconnect();
	}
}

export { TerminalGame, type GameState };
