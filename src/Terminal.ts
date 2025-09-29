import { css, html, type PropertyValues } from 'lit';
import { state } from 'lit/decorators/state.js';
import { map } from 'lit/directives/map.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { Component } from './litutil/Component.ts';
import { configService } from './services/config.ts';
import { parseCommand } from './services/parse-command.ts';
import type { TerminalInput } from './TerminalInput.ts';
import { commandNotFound, findCommand, helpCommands } from './terminal/commands.ts';
import type { Command, TerminalResponse } from './terminal/terminal.ts';

interface CommandResponse {
	type: 'text';
	text: string;
}

interface CommandResultResponse {
	type: 'result';
	result: TerminalResponse;
}

type Response = CommandResponse | CommandResultResponse;

export class Terminal extends Component {
	static styles = css`
		:host {
			width: 100%;
			height: 100%;
			max-width: 850px;
			max-height: 550px;
		}

		.terminal {
			background-color: #1e1e1e;
			color: rgb(218, 218, 218);
			font-family: VT323, monospace;
			border: 4px solid var(--border-color);
			border-radius: 1px;
			font-size: 1.5em;

			height: 100%;
			width: 100%;

			box-shadow: 0 0 30px var(--glow-color);

			display: flex;
			flex-direction: column;

			&.hidden {
				display: none;
			}
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

		.body {
			flex: 1 1 auto;
			overflow: hidden;

			padding: 0 10px;

			display: flex;
			flex-direction: row;
		}

		.terminal-content {
			padding: 10px;
			display: flex;
			flex-direction: column;
			flex: 1 1 auto;
			overflow: hidden;
			height: 100%;

			.history {
				overflow: auto;
				padding-right: 5px;

				&.disable-scroll {
					overflow: hidden;
				}

				&::-webkit-scrollbar {
          display: none;
        }
			}

			.command-input {
				flex: 0 0 auto;
			}
		}
	`;

	#inputRef: Ref<TerminalInput> = createRef();
	#focusInput = this.focusInput.bind(this);
	#historyRef: Ref<HTMLDivElement> = createRef();
	#suggestionTimeout: number | null = null;
	#resolvePromptResponse: ((value: string) => void) | null = null;
	#resizeObserver: ResizeObserver | null = null;

	@state() inputDisabled: boolean = false;
	@state() hidden: boolean = false;
	@state() responses: Response[] = [];
	@state() terminalHeight: number = 0;
	@state() terminalWidth: number = 0;

	get historyElement() {
		if (!this.#historyRef.value) {
			throw new Error('History element not available');
		}
		return this.#historyRef.value;
	}

	get inputElement() {
		if (!this.#inputRef.value) {
			throw new Error('Input element not available');
		}
		return this.#inputRef.value;
	}

	addResponse(response: Response) {
		this.responses = [...this.responses, response];
		requestAnimationFrame(() => {
			this.historyElement.scrollTo({
				top: this.historyElement.scrollHeight,
				behavior: 'smooth',
			});
		});
	}

	addCommandText(text: string) {
		this.addResponse({ type: 'text', text });
	}

	addResult(response: TerminalResponse) {
		this.addResponse({ type: 'result', result: response });
	}

	focusInput() {
		if (window.getSelection()?.toString()) return;
		this.inputElement.focus();
	}

	pasteCommand(command: string) {
		this.inputElement.value = command;
		this.focusInput();
	}

	clear() {
		this.responses = [];
	}

	disableInput() {
		this.inputDisabled = true;
	}

	enableInput() {
		this.inputDisabled = false;

		return this.updateComplete;
	}

	async executeCommand(command: Command, ...args: string[]) {
		const execute = command.prepare(this);

		try {
			const result = await execute(...args);
			if (result === null) return;
			this.addResult(result);
		} catch (e) {
			if (e instanceof Error) {
				this.addResult([{ type: 'text', text: `Error: ${e.message}` }]);
				return;
			}
			this.addResult([{ type: 'text', text: 'Error: An unknown error occurred.' }]);
		}
	}

	async onCommandSubmit(event: CustomEvent<{ value: string }>) {
		const commandAndArgs = event.detail.value.trim();

		if (commandAndArgs.length !== 0) {
			this.addCommandText(commandAndArgs);
		}

		if (this.#resolvePromptResponse) {
			this.#resolvePromptResponse(commandAndArgs);
			return;
		}

		if (commandAndArgs.length === 0) {
			return;
		}

		const { command: commandName, args } = parseCommand(commandAndArgs);
		const command = findCommand(commandName);
		if (!command) {
			this.addResult(commandNotFound(commandName));
			return;
		}

		await this.executeCommand(command, ...args);
	}

	hide() {
		this.hidden = true;
	}

	prompt(prompt: TerminalResponse): Promise<[string, boolean]> {
		return new Promise(resolve => {
			this.addResult(prompt);
			this.#resolvePromptResponse = value => {
				this.#resolvePromptResponse = null;
				resolve([value, value.length > 0]);
			};
		});
	}

	#makeRandomSuggestion() {
		// Don't make a suggestion if we're currently waiting for a prompt response
		if (this.#resolvePromptResponse) return;
		const randomeCommand = helpCommands[Math.floor(Math.random() * helpCommands.length)];
		if (!randomeCommand) return;
		this.inputElement.suggestPlaceholder(randomeCommand.name);
	}

	connectedCallback(): void {
		super.connectedCallback();
		this.addEventListener('click', this.#focusInput);

		setTimeout(() => {
			this.inputElement.suggestPlaceholder('help');
		}, 4000);
		this.#suggestionTimeout = window.setInterval(() => {
			if (this.inputDisabled) return;
			this.#makeRandomSuggestion();
		}, 15_000);
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		this.removeEventListener('click', this.#focusInput);
		this.#suggestionTimeout && clearInterval(this.#suggestionTimeout);
		this.#resizeObserver?.disconnect();
	}

	firstUpdated(_changedProperties: PropertyValues): void {
		super.firstUpdated(_changedProperties);

		this.terminalHeight = this.shadowRoot?.host.clientHeight || 0;
		this.terminalWidth = this.shadowRoot?.host.clientWidth || 0;

		this.#resizeObserver = new ResizeObserver(entries => {
			this.terminalHeight = entries[0].contentRect.height;
			this.terminalWidth = entries[0].contentRect.width;
		});
		this.#resizeObserver.observe(this.shadowRoot?.host as Element);
	}

	renderResponse(response: Response) {
		switch (response.type) {
			case 'result':
				return html`<mh-terminal-response-item
					.result=${response.result}
					typewriter-chars-per-second=${configService.value.typewriterCharsPerSecond}
				></mh-terminal-response-item>`;
			case 'text':
				return html`<mh-terminal-section>${response.text}</mh-terminal-section>`;
		}
	}

	render() {
		return html`
			<style>
				:host {
					--terminal-height: ${this.terminalHeight}px;
					--terminal-width: ${this.terminalWidth}px;
				}
			</style>
			<div class="terminal ${this.hidden ? 'hidden' : ''}">
				<div class="header">
					<img class="icon" src="./assets/mh_sh_icon.svg" alt=">_MH"/>
					<div class="title">
						<span>${window.location.hostname} - Terminal</span>
					</div>
				</div>
				<div class="body">
					<div class="terminal-content">
						<div class="history ${this.inputDisabled ? 'disable-scroll' : ''}" ${ref(this.#historyRef)}>
							${map(this.responses, response => this.renderResponse(response))}
						</div>
						<div class="command-input">
							<mh-terminal-input
								${ref(this.#inputRef)}
								?disabled=${this.inputDisabled}
								@submit=${this.onCommandSubmit}
							>
							</mh-terminal-input>
						</div>
					</div>
				</div>
			</div>
		`;
	}
}

customElements.define('mg-terminal', Terminal);
