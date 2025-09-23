import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';
import { Component } from './litutil/Component.ts';
import type { CommandResult, ResultItem } from './services/commands.ts';
import type { Terminal } from './Terminal.ts';

const TYPEWRITER_CHARS_PER_SECOND = 60;

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
		.command-response {
			line-height: 1;
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
		}

		a {
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
	`;

	@property({ type: Boolean, attribute: 'use-typewriter' }) useTypewriter = false;
	@property({ attribute: false }) terminal: Terminal | null = null;
	@property({ type: String, attribute: 'command-and-args' }) commandAndArgs = '';
	@property({ attribute: false }) result: CommandResult = [];

	@state() _displayedContent: TemplateResult<1> | TemplateResult<1>[] = html``;

	connectedCallback(): void {
		super.connectedCallback();

		if (!this.useTypewriter) {
			this._displayedContent = this.#renderResponse(this.result);
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
		let lastPartIndex = 0;
		let lastPartCharIndex = 0;
		let lastTime = 0;

		const frame = (time: DOMHighResTimeStamp) => {
			if (lastTime === 0) {
				lastTime = time;
				requestAnimationFrame(frame);
				return;
			}

			const delta = time - lastTime;
			const charsToAdd = Math.floor((delta / 1000) * TYPEWRITER_CHARS_PER_SECOND);
			if (charsToAdd === 0) {
				requestAnimationFrame(frame);
				return;
			}

			let charsLeftToAdd = charsToAdd;
			const renderedParts: TemplateResult<1>[] = this.renderFinishedParts(lastPartIndex);

			const [unfinishedPart, remainderRenderedChars] = this.renderUnfinishedPart(
				lastPartIndex,
				lastPartCharIndex,
				charsLeftToAdd,
			);
			if (unfinishedPart) {
				renderedParts.push(unfinishedPart);
				charsLeftToAdd -= remainderRenderedChars;
				if (charsLeftToAdd < 0) {
					// still rendering this part over more frames
					lastPartCharIndex += charsToAdd;
					this._displayedContent = renderedParts;
					requestAnimationFrame(frame);
					return;
				}

				// finished rendering this part
				lastPartIndex++;
				lastPartCharIndex = 0;
			}

			for (let i = lastPartIndex; i < this.result.length; i++) {
				const part = this.result[i];
				const [renderedPart, partLength] = this.#renderResponsePart(part, 0);
				renderedParts.push(renderedPart);
				charsLeftToAdd -= partLength;

				if (charsLeftToAdd < 0) {
					// started rendering this part, but didn't finish
					lastPartIndex = i;
					lastPartCharIndex = partLength + charsLeftToAdd; // charsLeftToAdd is negative here
					break;
				}
			}

			this._displayedContent = renderedParts;
			if (charsLeftToAdd > 0) {
				// finished, because there are still chars available, but no more parts to render
				return;
			}

			lastTime = time;
			requestAnimationFrame(frame);
		};

		requestAnimationFrame(frame);
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
				return [html`<br />`, 1];
			case 'button': {
				const terminal = this.terminal;
				if (!terminal) {
					throw new Error('TerminalResponseRenderer: terminal is not set');
				}
				return [
					html`<button class="highlight ${part.highlightType ?? ''}" @click=${() => part.action(terminal)}>${cutText(part.text, maxCharsToRender)}</button>`,
					part.text.length,
				];
			}
		}
	}

	#renderResponse(response: CommandResult) {
		return response.map(part => this.#renderResponsePart(part, -1)[0]);
	}

	render() {
		return html`
			<mh-terminal-section>
				${this.commandAndArgs}
			</mh-terminal-section>
			<div class="command-response">
				${this._displayedContent}
			</div>
		`;
	}
}

customElements.define('mh-terminal-response-item', TerminalResponseItem);
