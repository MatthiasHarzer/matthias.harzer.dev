import { css, html } from 'lit';
import { state } from 'lit/decorators/state.js';
import { map } from 'lit/directives/map.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { Component } from './litutil/Component.ts';
import { commandNotFound, type CommandResult, findCommand } from './services/commands.ts';
import { parseCommand } from './services/parse-command.ts';
import type { TerminalInput } from './TerminalInput.ts';

interface Response {
	result: CommandResult;
	commandAndArgs: string;
}

export class Terminal extends Component {
	static styles = css`
		:host {
			display: block;
			height: 100%;
			width: 100%;

			background-color: #1e1e1e;
			color: rgb(218, 218, 218);
			font-family: VT323, monospace;
			border: 4px solid var(--border-color);
			border-radius: 1px;
			font-size: 1.5em;

			box-shadow: 0 0 30px var(--glow-color);

			width: 100%;
			height: 100%;
			max-width: 850px;
			max-height: 550px;

			display: flex;
			flex-direction: column;
		}

		.header {
			flex: 0 0 auto;
			border-bottom: 2px solid var(--border-color);
			display: flex;
			flex-direction: row;
			align-items: center;
			padding: 0 15px;

			.icon {
				margin-right: 10px;

				width: 40px;
				height: 40px;
			}
		}

		.terminal-content {
			padding: 10px;
		}
	`;

	#inputRef: Ref<TerminalInput> = createRef();
	#focusInput = this.focusInput.bind(this);

	@state() responses: Response[] = [];

	addResponse(response: Response) {
		this.responses = [...this.responses, response];
	}

	focusInput() {
		if (window.getSelection()?.toString()) return;
		this.#inputRef.value?.focus();
	}

	onCommandSubmit(event: CustomEvent<{ value: string }>) {
		const commandAndArgs = event.detail.value.trim();
		const { command: commandName, args } = parseCommand(commandAndArgs);
		const command = findCommand(commandName);
		if (!command) {
			this.addResponse({
				result: commandNotFound(commandName),
				commandAndArgs: commandAndArgs,
			});
			return;
		}

		const result = command.execute(...args);
		this.addResponse({
			result,
			commandAndArgs: commandAndArgs,
		});
	}

	connectedCallback(): void {
		super.connectedCallback();
		this.addEventListener('click', this.#focusInput);
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		this.removeEventListener('click', this.#focusInput);
	}

	render() {
		return html`
			<div class="header">
				<img class="icon" src="/assets/mh_sh_icon.svg" alt=">_MH"/>
				<div class="title">
					<span>${window.location.hostname} - Terminal</span>
				</div>
			</div>
			<div class="body">
				<!-- <div class="terminal-commands discrete-scrollbar">
					<div class="commands-header">
						Commands
					</div>
					<div id="commands-list">
					</div>
				</div> -->
				<div class="terminal-content">
					<div class="history">
						${map(
							this.responses,
							response => html`
							<mh-terminal-response-item
								.result=${response.result}
								command-and-args=${response.commandAndArgs}
								.terminal=${this}
								use-typewriter
								>
							</mh-terminal-response-item>
						`,
						)}
					</div>
					<div class="command-input">
						<mh-terminal-input
						 ${ref(this.#inputRef)}
						 @submit=${this.onCommandSubmit}
						>
						</mh-terminal-input>
					</div>
				</div>
			</div>
		`;
	}
}

customElements.define('mg-terminal', Terminal);
