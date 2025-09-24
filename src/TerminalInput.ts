import { css, html } from 'lit';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { Component } from './litutil/Component.ts';

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

	#onKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'Enter':
				this.dispatch('submit', { value: this.#input.value });
				this.#input.value = '';
				break;
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
			/>
			</mh-terminal-section>
		`;
	}
}

customElements.define('mh-terminal-input', TerminalInput);
