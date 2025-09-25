import { Observable, type ReadOnlyObservable } from './reactive.ts';

const saveMod = (m: number, n: number) => ((m % n) + n) % n;

type Color = [number, number, number];

class RainbowProvider extends Observable<Color> {
	#index = 0;
	constructor(initialColor: Color, delayMs: number) {
		super(initialColor);

		setInterval(this.tick.bind(this), delayMs);
	}

	tick() {
		const previousIndex = saveMod(this.#index - 1, 3);

		if (this.observableValue[this.#index] >= 255) {
			this.observableValue[this.#index] = 255;
			this.observableValue[previousIndex] -= 1;
			if (this.observableValue[previousIndex] <= 0) {
				this.observableValue[previousIndex] = 0;
				this.#index = saveMod(this.#index + 1, 3);
			}
		} else {
			this.observableValue[this.#index] += 1;
		}

		this.notifySubscribers();
	}
}

const rainbowProvider: ReadOnlyObservable<Color> = new RainbowProvider([100, 0, 255], 50);

export { rainbowProvider };
export type { Color };
