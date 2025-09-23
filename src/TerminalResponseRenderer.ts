import { css, html } from 'lit';
import { state } from 'lit/decorators/state.js';
import { Component } from './litutil/Component.ts';
import type { CommandResult } from './services/commands.ts';

export class TerminalResponseRenderer extends Component {
	static styles = css`
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

	@state() responses: CommandResult[] = [];

	addResponse(response: CommandResult) {
		this.responses = [...this.responses, response];
	}

	render() {
		return html`
			${this.responses.map(
				response => html`
				<mh-terminal-section>
					<div class="command-response">${response}</div>
				</mh-terminal-section>
			`,
			)}
		`;
	}
}

customElements.define('mh-terminal-response-renderer', TerminalResponseRenderer);
