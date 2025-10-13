import { html, type TemplateResult } from 'lit';
import type { Terminal } from '../../../Terminal.ts';
import { treeSuggestions } from '../../suggestionsutil.ts';
import {
	type Command,
	component,
	indentation,
	linebreak,
	mentionCommandName,
	type TerminalFunction,
	text,
} from '../../terminal.ts';

class PongCommand implements Command {
	name = 'pong';
	description = 'Play a game of pong';
	prepare(terminal: Terminal): TerminalFunction {
		return (option: string = '') => {
			let content: TemplateResult;

			switch (option.toLowerCase().trim()) {
				case '':
					content = html`<mh-terminal-pong .terminal=${terminal}></mh-terminal-pong>`;
					break;
				case 'vs':
					content = html`<mh-terminal-pong .terminal=${terminal} enable-2nd-player></mh-terminal-pong>`;
					break;
				default:
					return [
						text(`Unknown option "${option}". Try "`),
						mentionCommandName(terminal, 'vs', 'pong vs'),
						text('".'),
					];
			}

			terminal.disableInput();
			return [component(content)];
		};
	}
	provideHelpDetails(terminal: Terminal): TerminalFunction {
		return (...args: string[]) => {
			if (args.length === 0) {
				return [
					text(
						'Starts a game of pong inside the terminal. Optionally, you can play against a second player.',
					),
					linebreak(),
					text('Examples:'),
					linebreak(),
					indentation(2, [
						mentionCommandName(terminal, 'pong'),
						text(
							' - Starts a single player infinite game. For every ball you hit, you get a point. Try to maximize your highscore!',
						),
						linebreak(),
						mentionCommandName(terminal, 'pong vs'),
						text(' - Starts a two player game. First to 5 points wins.'),
					]),
				];
			}
			switch (args[0].toLowerCase()) {
				case 'vs':
					return [
						text('Starts a game of pong against a second player.'),
						linebreak(1),
						text('Controls:'),
						linebreak(),
						indentation(2, [
							text('Left Player: W/S'),
							linebreak(),
							text('Right Player: Arrow Up/Down'),
						]),
						linebreak(1),
						text('First to 5 points wins.'),
					];
				default:
					return [text(`Unknown option "${args[0]}".`)];
			}
		};
	}

	provideSuggestions = treeSuggestions({
		vs: {},
		'': {},
	});
}

const pong: Command = new PongCommand();

export default pong;
