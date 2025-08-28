import { css, html } from 'lit';
import { Component } from './litutil/Component.ts';

export class App extends Component {
	static styles = css`
		.background {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
		}

		.terminal {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			top: 0;
			display: flex;
			justify-content: center;
			align-items: center;
		}
	`;

	render() {
		return html`
			<div class="background">
				<mh-background></mh-background>
			</div>
			<div class="terminal">
				<mg-terminal></mg-terminal>
			</div>
		`;
	}
}

customElements.define('mh-app', App);
