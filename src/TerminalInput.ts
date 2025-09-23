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

	focus() {
		this.#inputRef.value?.focus();
	}

	onKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'Enter':
				this.dispatch('submit', { value: this.#input.value });
				this.#input.value = '';
				break;
		}
	}

	render() {
		return html`
			<mh-terminal-section>
				<input
					${ref(this.#inputRef)}
					@keydown=${this.onKeydown}
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
