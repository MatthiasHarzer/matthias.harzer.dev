import type { Color } from './rainbow.ts';

const drawGlowingText = (
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	textColor: string,
	glowColor: string,
	glowDistance: number = 10,
	fontSize: number = 60,
) => {
	ctx.save();
	ctx.shadowBlur = glowDistance;
	ctx.shadowColor = glowColor;
	ctx.font = `${fontSize}px Karla`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = textColor;

	ctx.strokeText(text, x, y);

	for (let i = 0; i < 3; i++) ctx.fillText(text, x, y); //seems to be washed out without 3 fills

	ctx.restore();
};

const colorToString = (color: Color | string) => {
	if (typeof color === 'string') {
		return color;
	}
	return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
};

class FaviconSetter {
	#canvas: HTMLCanvasElement;
	#context: CanvasRenderingContext2D;

	constructor(canvas: HTMLCanvasElement) {
		this.#canvas = canvas;

		const context = this.#canvas.getContext('2d');
		if (!context) {
			throw new Error('Failed to get 2D context for favicon canvas.');
		}
		this.#context = context;

		this.#canvas.width = 100;
		this.#canvas.height = 100;
	}

	setColor(color: Color | string) {
		const colorStr = colorToString(color);
		this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
		drawGlowingText(
			this.#context,
			'MH',
			this.#canvas.width / 2,
			this.#canvas.height / 2,
			'#ffffff',
			colorStr,
			10,
			60,
		);
		const url = this.#canvas.toDataURL('image/png');
		const link =
			(document.querySelector("link[rel~='icon']") as HTMLLinkElement) ||
			document.createElement('link');
		link.type = 'image/png';
		link.rel = 'shortcut icon';
		link.href = url;
		document.head.appendChild(link);
	}
}

const canvas = document.createElement('canvas');
const faviconSetter = new FaviconSetter(canvas);

export { faviconSetter };
