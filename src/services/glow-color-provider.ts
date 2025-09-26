import { configService } from './config.ts';
import { rainbowProvider } from './rainbow.ts';
import { Observable, type ReadOnlyObservable } from './reactive.ts';

class GlowColorProvider extends Observable<string> {
	constructor() {
		super('#6400FFFF');

		configService.observeKey('glowColor', color => {
			if (color === 'rainbow') return;
			this.set(color);
		});
		rainbowProvider.subscribe(color => {
			if (configService.value.glowColor !== 'rainbow') return;
			this.set(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
		}, true);
	}
}

const glowColorProvider: ReadOnlyObservable<string> = new GlowColorProvider();

export { glowColorProvider };
