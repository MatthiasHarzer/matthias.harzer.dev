import { css, html } from 'lit';
import { property } from 'lit/decorators/property.js';
import { Component } from '../litutil/Component.ts';

interface Coordinates {
	x: number;
	y: number;
}

const generateOuterPath = (radius: number, pixelSize: number) => {
	const points = generatePoints(radius, pixelSize);
	const flipped = flipCoords(points);

	return generatePath(flipped);
};

const generateInnerPath = (radius: number, pixelSize: number, offset: number, reverse = false) => {
	const points = generatePoints(radius, pixelSize);
	const inset =
		offset < radius ? insetCoords(points, pixelSize, offset) : generatePoints(2, pixelSize, offset);
	const flipped = flipCoords(inset);
	const corners = addCorners(flipped);

	return generatePath(corners, reverse);
};

const generatePath = (coords: Coordinates[], reverse = false) => {
	const mirroredCoords = mirrorCoords(coords);

	return (reverse ? mirroredCoords : mirroredCoords.reverse())
		.map(point => {
			return `${point.x} ${point.y}`;
		})
		.join(',\n    ');
};

const generatePoints = (radius: number, pixelSize: number, offset = 0) => {
	const coords: Coordinates[] = [];

	const lastCoords = {
		x: -1,
		y: -1,
	};

	for (let i = 270; i > 225; i--) {
		const x = Math.floor(radius * Math.sin((2 * Math.PI * i) / 360) + radius + 0.5) * pixelSize;
		const y = Math.floor(radius * Math.cos((2 * Math.PI * i) / 360) + radius + 0.5) * pixelSize;

		if (x !== lastCoords.x || y !== lastCoords.y) {
			lastCoords.x = x;
			lastCoords.y = y;

			coords.push({
				x: x + offset * pixelSize,
				y: y + offset * pixelSize,
			});
		}
	}

	const mergedCoords = mergeCoords(coords);
	const corners = addCorners(mergedCoords);

	return corners;
};

const flipCoords = (coords: Coordinates[]) => {
	return [...coords, ...coords.map(({ x, y }) => ({ x: y, y: x })).reverse()].filter(
		({ x, y }, i, arr) => {
			return !i || arr[i - 1].x !== x || arr[i - 1].y !== y;
		},
	);
};

const insetCoords = (coords: Coordinates[], pixelSize: number, offset: number) => {
	return coords
		.map(({ x, y }) => ({
			x: x + pixelSize * offset,
			y: y + pixelSize * Math.floor(offset / 2),
		}))
		.reduce((ret, item) => {
			if (ret.length > 0 && ret[ret.length - 1].x === ret[ret.length - 1].y) {
				return ret;
			}

			ret.push(item);

			return ret;
		}, [] as Coordinates[]);
};

const mergeCoords = (coords: Coordinates[]) => {
	return coords.reduce((result, point, index) => {
		if (index !== coords.length - 1 && point.x === 0 && coords[index + 1].x === 0) {
			return result;
		}

		if (index !== 0 && point.y === 0 && coords[index - 1].y === 0) {
			return result;
		}

		if (
			index !== 0 &&
			index !== coords.length - 1 &&
			point.x === coords[index - 1].x &&
			point.x === coords[index + 1].x
		) {
			return result;
		}

		result.push(point);
		return result;
	}, [] as Coordinates[]);
};

const addCorners = (coords: Coordinates[]) => {
	return coords.reduce((result, point, i) => {
		result.push(point);

		if (
			coords.length > 1 &&
			i < coords.length - 1 &&
			coords[i + 1].x !== point.x &&
			coords[i + 1].y !== point.y
		) {
			result.push({
				x: coords[i + 1].x,
				y: point.y,
			});
		}

		return result;
	}, [] as Coordinates[]);
};

const mirrorCoords = (coords: Coordinates[], offset = 0) => {
	return [
		...coords.map(({ x, y }) => ({
			x: offset ? `${x + offset}px` : `${x}px`,
			y: offset ? `${y + offset}px` : `${y}px`,
		})),
		...coords.map(({ x, y }) => ({
			x: edgeCoord(y, offset),
			y: offset ? `${x + offset}px` : `${x}px`,
		})),
		...coords.map(({ x, y }) => ({
			x: edgeCoord(x, offset),
			y: edgeCoord(y, offset),
		})),
		...coords.map(({ x, y }) => ({
			x: offset ? `${y + offset}px` : `${y}px`,
			y: edgeCoord(x, offset),
		})),
	];
};

const edgeCoord = (n: number, offset: number) => {
	if (offset) {
		return n === 0 ? `calc(100% - ${offset}px)` : `calc(100% - ${offset + n}px)`;
	}

	return n === 0 ? '100%' : `calc(100% - ${n}px)`;
};

const calculateStyles = (pixelSize: number, radius: number, borderWidth: number, color: string) => {
	const outerPath = generateOuterPath(radius, pixelSize);
	const innerPath = generateInnerPath(radius, pixelSize, borderWidth, true);

	const borderPath = `${outerPath},
    0px 50%,
    ${borderWidth * pixelSize}px 50%,
    ${innerPath},
    ${borderWidth * pixelSize}px 50%,
    0px 50%`;

	const generatedCSS = `.pixel-corners,
.pixel-corners--wrapper {
  clip-path: polygon(${outerPath});
  position: relative;
}
.pixel-corners {
  border: ${borderWidth * pixelSize}px solid transparent;
}
.pixel-corners--wrapper {
  width: fit-content;
  height: fit-content;
}
.pixel-corners--wrapper .pixel-corners {
  display: block;
  clip-path: polygon(${innerPath});
}
.pixel-corners::after,
.pixel-corners--wrapper::after {
  content: "";
  position: absolute;
  clip-path: polygon(${borderPath});
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${color};
  display: block;
  pointer-events: none;
}
.pixel-corners::after {
  margin: -${borderWidth * pixelSize}px;
}`;

	return generatedCSS;
};

export class PixelBorder extends Component {
	static styles = css`
		:host {
			display: inline-block;
		}
	`;

	@property({ type: Number }) pixelSize = 3;
	@property({ type: Number }) radius = 4;
	@property({ type: Number }) borderWidth = 1;
	@property({ type: String }) color = 'currentColor';

	render() {
		return html`
			<style>
				${calculateStyles(this.pixelSize, this.radius, this.borderWidth, this.color)}
			</style>
			<div class="pixel-corners--wrapper">
				<div class="pixel-corners">
					<slot></slot>
				</div>
			</div>
		`;
	}
}

customElements.define('mh-pixel-border', PixelBorder);
