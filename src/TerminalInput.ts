import { css, html } from 'lit';
import { property } from 'lit/decorators/property.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { Component } from './litutil/Component.ts';
import { getSuggestions } from './terminal/suggestions.ts';

export class TerminalInput extends Component {
	static styles = css`
		input {
			color: inherit;
			font-family: inherit;
			background-color: transparent;
			border: none;
			outline: none;
			width: 100%;
			font-size: inherit;
		}
	`;

	#inputRef: Ref<HTMLInputElement> = createRef();
	#history: string[] = [];
	#historyIndex = -1;
	#suggestions: string[] = [];
	#suggestionIndex = -1;

	@property({ type: Boolean }) disabled = false;

	get #input() {
		if (!this.#inputRef.value) {
			throw new Error('Input element not found');
		}
		return this.#inputRef.value;
	}

	set value(value: string) {
		this.#input.value = value;
	}

	get value() {
		return this.#input.value;
	}

	focus() {
		this.#inputRef.value?.focus();
	}

	async handleSuggestions() {
		if (this.#suggestionIndex === -1) {
			this.#suggestions = await getSuggestions(this.value);
		}
		if (this.#suggestions.length === 0) {
			return;
		}
		this.#suggestionIndex = (this.#suggestionIndex + 1) % this.#suggestions.length;
		this.#input.value = this.#suggestions[this.#suggestionIndex];
	}

	#onKeydown(event: KeyboardEvent) {
		if (this.disabled) return;
		switch (event.key) {
			case 'Tab': {
				this.handleSuggestions();
				event.preventDefault();
				break;
			}
			case 'Enter': {
				const value = this.#input.value.trim();
				this.dispatch('submit', { value });
				this.#input.value = '';
				this.#history.push(value);
				this.#historyIndex = this.#history.length;
				event.preventDefault();
				break;
			}
			case 'ArrowUp': {
				if (this.#history.length === 0) break;
				if (this.#historyIndex > 0) {
					this.#historyIndex--;
					this.#input.value = this.#history[this.#historyIndex];
				}
				event.preventDefault();
				break;
			}
			case 'ArrowDown': {
				if (this.#history.length === 0) break;
				if (this.#historyIndex < this.#history.length - 1) {
					this.#historyIndex++;
					this.#input.value = this.#history[this.#historyIndex];
				} else {
					this.#historyIndex = this.#history.length;
					this.#input.value = '';
				}
				event.preventDefault();
				break;
			}
			default: {
				this.#suggestionIndex = -1;
				break;
			}
		}
	}

	#writePlaceholder(text: string, baseCharDelayMs: number, maxVariableDelayMs: number) {
		return new Promise<void>(resolve => {
			let charIndex = 0;
			const next = () => {
				if (charIndex >= text.length) {
					resolve();
					return;
				}

				this.#input.placeholder += text[charIndex];
				charIndex++;

				const delay = baseCharDelayMs + Math.random() * maxVariableDelayMs;
				setTimeout(next, delay);
			};
			next();
		});
	}

	#clearPlaceholder(charDelayMs: number) {
		return new Promise<void>(resolve => {
			const id = setInterval(() => {
				this.#input.placeholder = this.#input.placeholder.slice(0, -1);

				if (this.#input.placeholder.length === 0 || this.#input.value.length > 0) {
					clearInterval(id);
					this.#input.placeholder = '';
					resolve();
				}
			}, charDelayMs);
		});
	}

	async suggestPlaceholder(text: string) {
		const hasValue = this.#input.value.length > 0;
		const hasPlaceholder = this.#input.placeholder.length > 0;

		if (hasValue) return;
		if (hasPlaceholder) await this.#clearPlaceholder(20);
		await this.#writePlaceholder(text, 70, 80);
		await this.sleep(2500);
		await this.#clearPlaceholder(50);
	}

	render() {
		return html`
			<mh-terminal-section>
				<input
					${ref(this.#inputRef)}
					@keydown=${this.#onKeydown}
					type="text"
					id="terminal-input"
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
					?disabled=${this.disabled}
			/>
			</mh-terminal-section>
		`;
	}
}

customElements.define('mh-terminal-input', TerminalInput);
