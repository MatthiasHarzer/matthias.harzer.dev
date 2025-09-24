import { css, html } from 'lit';
import { Component } from './litutil/Component.ts';
import { configService } from './services/config.ts';
import { faviconSetter } from './services/favicon-setter.ts';
import { rainbowProvider } from './services/rainbow.ts';

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

	connectedCallback(): void {
		super.connectedCallback();

		rainbowProvider.subscribe(color => {
			if (configService.value.glowColor !== 'rainbow') return;
			faviconSetter.setColor(color);
		}, true);
		configService.observeKey(
			'glowColor',
			color => {
				if (color !== 'rainbow') {
					faviconSetter.setColor(color);
				}
			},
			true,
		);
	}

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
