import { css, html } from 'lit';
import { Component } from './litutil/Component.ts';

export class TerminalSection extends Component {
	static styles = css`
		:host {
			display: flex;
			flex-direction: row;
			align-items: flex-start;
		}

		.prompt {
			color: #50fa7b;
			margin-right: 10px;
		}
	`;

	render() {
		return html`
			<span class="prompt">>_</span>
			<slot></slot>
		`;
	}
}

customElements.define('mh-terminal-section', TerminalSection);
