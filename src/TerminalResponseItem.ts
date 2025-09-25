import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';
import { Component } from './litutil/Component.ts';
import type { CommandResult, ResultItem } from './services/command-result.ts';

const cutText = (text: string, maxLength: number) => {
	if (maxLength === -1) {
		return text;
	}
	if (text.length <= maxLength) {
		return text;
	}
	return text.slice(0, maxLength);
};

export class TerminalResponseItem extends Component {
	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			gap: 0.2em;
			padding: 0.2em 0;
		}

		.response {
			position: relative;

			.placeholder-render {
				visibility: hidden;
			}

			.command-response {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
			}
		}

		.linebreak {
			display: block;
		}

		.highlight {
			color: #fd63f8;

			&.lit {
				color: #4c64ff;
			}

			&.go {
				color: #00add8;
			}

			&.svelte {
				color: #f96743;
			}

			&.vue {
				color: #41b883;
			}

			&.node {
				color: #8cc84b;
			}

			&.python {
				color: #3572a5;
			}

			&.flutter {
				color: #31b9f6;
			}

			&.java {
				color: #b07219;
			}

			&.cs {
				color: #178600;
			}

			&.error {
				color: #ff5555;
			}

			&.rainbow {
				background: linear-gradient(90deg,
						#ff2c55,
						#ff6555,
						#ffaa55,
						#ffd955,
						#ffee55,
						#d4ff55,
						#8cff55,
						#55ff6e,
						#55ffb9,
						#55ffea,
						#55f7ff,
						#55c4ff,
						#5581ff,
						#5557ff,
						#7a55ff,
						#b355ff,
						#e355ff,
						#ff55f0,
						#ff55b5,
						#ff558a,
						#ff5564,
						#ff5549);
				-webkit-background-clip: text;
				background-clip: text;
				-webkit-text-fill-color: transparent;
			}

			&.hka {
				color: #d72305;
			}

			&.thenativeweb {
				color: #dd0099;
			}

			&.eventql,
			&.eventsourcingdb {
				color: #25a55a;
			}

			&.smartreadinessindicator {
				color: #1d88cc
			}

			&.kit,
			&.tmb {
				color: #009682;
			}

			&.career-dates {
				color: #757575;
  			font-weight: lighter;
			}

			&.command {
				color: #8be9fd;
			}

			&.config-key {
				color: #ff79c6;
			}

			&.config-value {
				color: #f1fa8c;
			}
		}

		a.highlight {
			color: #bd93f9;
		}

		a, button {
			position: relative;

			text-decoration: none;
			background-image: linear-gradient(currentColor, currentColor);
			background-position: 0% 100%;
			background-repeat: no-repeat;
			background-size: 0% 2px;
			transition: background-size .3s;

			&:hover,
			&:focus {
				background-size: 100% 2px;
			}
		}

		button {
			background-color: transparent;
			border: none;
			color: inherit;
			font-family: inherit;
			font-size: inherit;
			cursor: pointer;
			padding: 0;
			margin: 0;
		}

		.indentation {
			&.0 {
				margin-left: 0;
			}

			&.l-1 {
				margin-left: 20px;
			}

			&.l-2 {
				margin-left: 40px;
			}

			&.l-3 {
				margin-left: 60px;
			}

			&.l-4 {
				margin-left: 80px;
			}
		}

		p {
			padding: 0.3em 0.3em 0 0.3em;

			&:last-child {
				padding-bottom: 0.3em;
			}
		}

		.hover-highlight-block {
			background-color: transparent;

			transition: background-color 0.2s;

			&:hover {
				background-color: rgba(68, 71, 90, 0.3);
			}
		}

		.pixel-emoji{
			display: inline-block;
			max-width: 1em;
			max-height: 1em;
			vertical-align: middle;
			padding-bottom: 0.15em;

			image-rendering: pixelated;
			image-rendering: -moz-crisp-edges;
			image-rendering: -o-crisp-edges;
			image-rendering: -webkit-optimize-contrast;
			image-rendering: optimize-contrast;
		}
	`;

	@property({ attribute: false }) result: CommandResult = [];
	@property({ type: Number, attribute: 'typewriter-chars-per-second' }) typewriterCharsPerSecond =
		-1;

	@state() _displayedContent: TemplateResult<1> | TemplateResult<1>[] = html``;
	#placeholderRender: TemplateResult<1> | TemplateResult<1>[] = html``;

	connectedCallback(): void {
		super.connectedCallback();

		this.#placeholderRender = this.#renderResponse(this.result);

		if (this.typewriterCharsPerSecond <= 0) {
			this._displayedContent = this.#placeholderRender;
			return;
		}
		this.runTypeWriterEffect();
	}

	renderFinishedParts(lastPartIndex: number) {
		const renderedParts: TemplateResult<1>[] = [];
		for (let i = 0; i < lastPartIndex; i++) {
			const part = this.result[i];
			const [renderedPart] = this.#renderResponsePart(part, -1);
			renderedParts.push(renderedPart);
		}

		return renderedParts;
	}

	renderUnfinishedPart(
		lastPartIndex: number,
		lastPartCharIndex: number,
		charsLeftToAdd: number,
	): [TemplateResult<1> | null, number] {
		const part = this.result[lastPartIndex];
		if (!part) {
			return [null, 0];
		}

		const [renderedPart, partLength] = this.#renderResponsePart(
			part,
			lastPartCharIndex + charsLeftToAdd,
		);
		const remainderRenderedChars = partLength - lastPartCharIndex;

		return [renderedPart, remainderRenderedChars];
	}

	runTypeWriterEffect() {
		let lastTime = 0;

		let numberOfCharsToRender = 0;

		const frame = (time: DOMHighResTimeStamp) => {
			if (lastTime === 0) {
				lastTime = time;
				requestAnimationFrame(frame);
				return;
			}

			const delta = time - lastTime;
			const charsToAdd = Math.floor((delta / 1000) * this.typewriterCharsPerSecond);
			if (charsToAdd === 0) {
				requestAnimationFrame(frame);
				return;
			}

			const renderedParts: TemplateResult<1>[] = [];

			numberOfCharsToRender += charsToAdd;
			let remainingCharsToRender = numberOfCharsToRender;
			for (let i = 0; i < this.result.length; i++) {
				const part = this.result[i];
				const [renderedPart, partLength] = this.#renderResponsePart(part, remainingCharsToRender);
				renderedParts.push(renderedPart);

				remainingCharsToRender -= partLength;
				if (remainingCharsToRender <= 0) {
					break;
				}
			}

			this._displayedContent = renderedParts;
			if (remainingCharsToRender > 0) {
				// finished, because there are still chars available, but no more parts to render
				return;
			}

			lastTime = time;
			requestAnimationFrame(frame);
		};

		requestAnimationFrame(frame);
	}

	#renderRepsonseParts(
		parts: ResultItem[],
		maxCharsToRender: number,
	): [TemplateResult<1>[], number] {
		const renderedParts: TemplateResult<1>[] = [];
		let charsRendered = 0;
		let totalLength = 0;
		for (const part of parts) {
			const [renderedPart, partLength] = this.#renderResponsePart(
				part,
				maxCharsToRender === -1 ? -1 : maxCharsToRender - charsRendered,
			);
			if (charsRendered < maxCharsToRender || maxCharsToRender === -1) {
				renderedParts.push(renderedPart);
				charsRendered += partLength;
			}

			totalLength += partLength;
		}
		return [renderedParts, totalLength];
	}

	#renderResponsePart(part: ResultItem, maxCharsToRender: number): [TemplateResult<1>, number] {
		switch (part.type) {
			case 'text':
				return [html`${cutText(part.text, maxCharsToRender)}`, part.text.length];
			case 'highlight':
				return [
					html`<span class="highlight ${part.highlightType ?? ''}">${cutText(part.text, maxCharsToRender)}</span>`,
					part.text.length,
				];
			case 'link':
				return [
					html`<a class="highlight ${part.highlightType ?? ''}" href="${part.href}" target="_blank" rel="noopener">${cutText(part.text, maxCharsToRender)}</a>`,
					part.text.length,
				];
			case 'linebreak':
				return [html`<div class="linebreak" style="height: ${part.height ?? 0}em;"></div>`, 1];
			case 'button': {
				return [
					html`<button class="highlight ${part.highlightType ?? ''}" @click=${() => part.action()}>${cutText(part.text, maxCharsToRender)}</button>`,
					part.text.length,
				];
			}
			case 'paragraph': {
				const [renderedParts, totalLength] = this.#renderRepsonseParts(
					part.parts,
					maxCharsToRender,
				);
				return [html`<p>${renderedParts}</p>`, totalLength];
			}
			case 'indentation': {
				const [renderedParts, totalLength] = this.#renderRepsonseParts(
					part.parts,
					maxCharsToRender,
				);
				return [html`<div class="indentation l-${part.level}">${renderedParts}</div>`, totalLength];
			}
			case 'hover-highlight-block': {
				const [renderedParts, totalLength] = this.#renderRepsonseParts(
					part.parts,
					maxCharsToRender,
				);
				return [html`<div class="hover-highlight-block">${renderedParts}</div>`, totalLength];
			}
			case 'emoji': {
				switch (part.emoji) {
					case '🎉':
						return [html`<img src="./assets/tada.webp" alt="🎉" class="pixel-emoji" />`, 1];
					default:
						return [html`<span>${part.emoji}</span>`, 1];
				}
			}
		}
	}

	#renderResponse(response: CommandResult) {
		return response.map(part => this.#renderResponsePart(part, -1)[0]);
	}

	render() {
		return html`
			<div class="response">
				<div class="placeholder-render">
					${this.#placeholderRender}
				</div>
				<div class="command-response">
					${this._displayedContent}
				</div>
			</div>
		`;
	}
}

customElements.define('mh-terminal-response-item', TerminalResponseItem);
