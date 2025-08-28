import { css, html } from 'lit';
import { Component } from './litutil/Component.ts';

export class Terminal extends Component {
	static styles = css`
		:host {
			display: block;
			height: 100%;
			width: 100%;
		}
	`;

	render() {
		return html`
			<div class="header">
				<img class="icon" src="/assets/mh_sh_icon.svg" alt=">_MH"/>
				<div class="title">
					<span>matthias.harzer.dev - Terminal</span>
				</div>
			</div>
			<div class="body">
				<div class="terminal-commands discrete-scrollbar">
					<div class="commands-header">
						Commands
					</div>
					<div id="commands-list">
					</div>
				</div>
				<div class="terminal-content">
					<div class="history" id="terminal-command-output"></div>
					<div class="command-line input-line">
						<label for="terminal-input">
							<span class="prompt">>_</span>
						</label>
						<input
								type="text"
								id="terminal-input"
								autocomplete="off"
								autocorrect="off"
								autocapitalize="off"
								spellcheck="false"
						/>
					</div>
				</div>
			</div>
		`;
	}
}

customElements.define('mg-terminal', Terminal);
