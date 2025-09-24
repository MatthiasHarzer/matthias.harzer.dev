import { css, html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { Component } from './litutil/Component.ts';
import { roundToNearest } from './services/round.ts';

const CHARACTERS = ['0', '1'];
const TRAIL_SIZE = 15;
const TRAIL_TIMEOUT = 1000;
const TRANSITION_TIME = 300;

interface TrailItem {
	x: number;
	y: number;
	char: string;
	timeoutId: number;
	element: HTMLElement;
}

interface Position {
	x: number;
	y: number;
}

export class Background extends Component {
	static styles = css`
		:host {
			display: block;
			height: 100%;
			width: 100%;
			background: rgb(32, 33, 36);
			background: linear-gradient(180deg,
			rgba(32, 33, 36, 1) 0%,
			rgba(40, 42, 54, 1) 50%,
			rgba(32, 33, 36, 1) 100%);
			--max-opacity: 0.8;
		}

		.char {
			position: absolute;
			pointer-events: none;
			overflow: hidden;
			color: #50fa7b;
			font-family: VT323, monospace;
		}

		@keyframes fadein {
			0% {
				opacity: 0;
			}
			100% {
				opacity: var(--max-opacity);
			}
		}

		@keyframes fadeout {
			0% {
				opacity: var(--max-opacity);
			}
			100% {
				opacity: 0;
			}
		}
	`;

	#onMouseMove = this.onMouseMove.bind(this);
	#containerRef = createRef<HTMLDivElement>();
	#lastTrailItem: TrailItem | null = null;

	get container() {
		if (!this.#containerRef.value) {
			throw new Error('Container not initialized');
		}
		return this.#containerRef.value;
	}

	connectedCallback(): void {
		super.connectedCallback();
		window.addEventListener('mousemove', this.#onMouseMove);
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		window.removeEventListener('mousemove', this.#onMouseMove);
	}

	cache = new Map<string, TrailItem>();

	createTrailElement(x: number, y: number, char: string): HTMLElement {
		const element = document.createElement('span');
		element.className = 'char';
		element.style.position = 'absolute';
		element.style.left = `${x}px`;
		element.style.top = `${y}px`;
		element.style.animation = 'fadein 0.3s forwards';
		element.textContent = char;
		return element;
	}

	setRemoveTimeout(id: string) {
		const existing = this.cache.get(id);
		if (!existing) {
			return 0;
		}

		const remove = () => {
			this.cache.delete(id);
			existing.element.remove();
		};

		clearTimeout(existing.timeoutId);

		existing.timeoutId = window.setTimeout(() => {
			existing.element.style.animation = 'fadeout 0.3s forwards';
			existing.timeoutId = window.setTimeout(remove, TRANSITION_TIME);
		}, TRAIL_TIMEOUT);
	}

	newTrailItem(x: number, y: number): TrailItem {
		const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
		const element = this.createTrailElement(x, y, char);

		// Technically this is illegal in lit, but due to state rendering issues otherwise, it has to be acceptable
		this.container.appendChild(element);
		return {
			x,
			y,
			char,
			element,
			timeoutId: 0,
		};
	}

	addChar(x: number, y: number) {
		const id = `${x}-${y}`;
		const existing = this.cache.get(id);

		if (!existing) {
			const trailItem = this.newTrailItem(x, y);
			this.cache.set(id, trailItem);
			this.container.appendChild(trailItem.element);
		} else {
			existing.element.style.animation = 'fadein 0.3s forwards';
		}

		this.#lastTrailItem = this.cache.get(id) || null;
		this.setRemoveTimeout(id);
	}

	getTrailPositions(newX: number, newY: number): Position[] {
		if (!this.#lastTrailItem) {
			return [
				{
					x: newX,
					y: newY,
				},
			];
		}

		const { x: lastX, y: lastY } = this.#lastTrailItem;
		const positions: Position[] = [];
		const dx = newX - lastX;
		const dy = newY - lastY;
		const total = Math.abs(dx) + Math.abs(dy);

		if (total === 0) {
			return [
				{
					x: newX,
					y: newY,
				},
			];
		}

		const xStep = dx / total;
		const yStep = dy / total;

		const coords = new Set<string>();
		for (let i = 0; i <= total; i++) {
			const x = roundToNearest(lastX + xStep * i, TRAIL_SIZE);
			const y = roundToNearest(lastY + yStep * i, TRAIL_SIZE);
			const id = `${x}-${y}`;

			if (!coords.has(id)) {
				positions.push({ x, y });
			}
			coords.add(id);
		}

		return positions;
	}

	onMouseMove(event: MouseEvent) {
		const x = roundToNearest(event.clientX, TRAIL_SIZE);
		const y = roundToNearest(event.clientY, TRAIL_SIZE);
		const positions = this.getTrailPositions(x, y);
		for (const { x, y } of positions) {
			this.addChar(x, y);
		}
	}

	render() {
		return html`
		<div ${ref(this.#containerRef)}>
		</div>
		`;
	}
}

customElements.define('mh-background', Background);
