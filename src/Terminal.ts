import { css, html } from 'lit';
import { state } from 'lit/decorators/state.js';
import { map } from 'lit/directives/map.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { LocalStateComponent } from './litutil/Component.ts';
import type { CommandResult } from './services/command-result.ts';
import { commandNotFound, findCommand, helpCommands } from './services/commands.ts';
import { parseCommand } from './services/parse-command.ts';
import { type Color, rainbowProvider } from './services/rainbow.ts';
import type { BaseObject } from './services/reactive-object.ts';
import type { TerminalInput } from './TerminalInput.ts';

interface CommandResponse {
	type: 'text';
	text: string;
}

interface CommandResultResponse {
	type: 'result';
	result: CommandResult;
}

type Response = CommandResponse | CommandResultResponse;

const toHexColor = (color: Color) => {
	const r = color[0].toString(16).padStart(2, '0');
	const g = color[1].toString(16).padStart(2, '0');
	const b = color[2].toString(16).padStart(2, '0');
	return `#${r}${g}${b}`;
};

const TYPEWRITER_CHARS_PER_SECOND = 300;

interface State {
	typewriterCharsPerSecond: number;
}

const initialState: State = {
	typewriterCharsPerSecond: TYPEWRITER_CHARS_PER_SECOND,
};

export class Terminal extends LocalStateComponent<State>({ initialState }) {
	static styles = css`
		:host {
			width: 100%;
			height: 100%;
			max-width: 850px;
			max-height: 550px;

			--glow-color: #6400FFFF;
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

	@state() hidden: boolean = false;
	@state() responses: Response[] = [];

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

	setConfig(key: string, value: string) {
		if (!(key in initialState)) {
			throw new Error(`Unknown config key "${key}".`);
		}

		const valueType = initialState[key as keyof State];

		switch (typeof valueType) {
			case 'number': {
				const numberValue = Number(value);
				if (Number.isNaN(numberValue)) {
					throw new Error(`Invalid value for config key "${key}". Expected a number.`);
				}
				(this.localState as BaseObject)[key] = value;
				break;
			}
			case 'boolean': {
				const boolValue = value === 'true' || value === '1';
				(this.localState as BaseObject)[key] = boolValue;
				break;
			}
			case 'string': {
				(this.localState as BaseObject)[key] = String(value);
				break;
			}
			default:
				throw new Error(`Unsupported config key type for key "${key}".`);
		}
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

	addResult(response: CommandResult) {
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

	hide() {
		this.hidden = true;
	}

	prompt(prompt: CommandResult): Promise<[string, boolean]> {
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
			this.#makeRandomSuggestion();
		}, 15_000);
		rainbowProvider.subscribe(() => {
			const colorStr = toHexColor(rainbowProvider.value);

			// This is not the ideal way to do this in Lit, but to prevent rerendering the entire component on every color change, we directly manipulate the style here.
			this.style.setProperty('--glow-color', colorStr);
		}, false);
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		this.removeEventListener('click', this.#focusInput);
		this.#suggestionTimeout && clearInterval(this.#suggestionTimeout);
	}

	renderResponse(response: Response) {
		switch (response.type) {
			case 'result':
				return html`<mh-terminal-response-item
					.result=${response.result}
					typewriter-chars-per-second=${this.localState.typewriterCharsPerSecond}
				></mh-terminal-response-item>`;
			case 'text':
				return html`<mh-terminal-section>${response.text}</mh-terminal-section>`;
		}
	}

	render() {
		return html`
			<div class="terminal ${this.hidden ? 'hidden' : ''}">
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
						<div class="history" ${ref(this.#historyRef)}>
							${map(this.responses, response => this.renderResponse(response))}
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
			</div>
		`;
	}
}

customElements.define('mg-terminal', Terminal);
