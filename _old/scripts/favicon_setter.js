import { onColorChange } from './rainbow_color_provider.js';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 100;
canvas.height = 100;

/**
 * Draws a glowing text on the canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {string} textColor
 * @param {string} glowColor
 * @param {number} glowDistance
 * @param {number} fontSize
 */
const drawGlowingText = (
	ctx,
	text,
	x,
	y,
	textColor,
	glowColor,
	glowDistance = 10,
	fontSize = 60,
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

/**
 *
 * @param {[number, number, number]} color
 */
const setFavicon = color => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawGlowingText(
		ctx,
		'MH',
		canvas.width / 2,
		canvas.height / 2,
		'#ffffff',
		`rgb(${color[0]}, ${color[1]}, ${color[2]})`,
		10,
		60,
	);
	const url = canvas.toDataURL('image/png');
	const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
	link.type = 'image/png';
	link.rel = 'shortcut icon';
	link.href = url;
	document.head.appendChild(link);
};

window.addEventListener('load', () => {
	onColorChange(setFavicon);
});
