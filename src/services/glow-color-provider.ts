import { configService } from './config.ts';
import { type Color, rainbowProvider } from './rainbow.ts';
import { Observable, type ReadOnlyObservable } from './reactive.ts';

const colorToRgb = (color: Color): string => {
	return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
};

class GlowColorProvider extends Observable<string> {
	constructor() {
		super('#6400FFFF');

		configService.observeKey('glowColor', color => {
			if (color === 'rainbow') return;
			this.set(color);
		});
		rainbowProvider.subscribe(color => {
			if (configService.value.glowColor !== 'rainbow') return;
			this.set(colorToRgb(color));
		}, true);
	}
}

const glowColorProvider: ReadOnlyObservable<string> = new GlowColorProvider();

export { glowColorProvider };
