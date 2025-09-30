import { html } from 'lit';
import { type Command, component, indentation, linebreak, text } from '../../terminal.ts';

const snake: Command = {
	name: 'snake',
	description: 'Play a game of Snake',
	prepare(terminal) {
		return () => {
			terminal.disableInput();
			return [component(html`<mh-terminal-snake .terminal=${terminal}></mh-terminal-snake>`)];
		};
	},
	provideHelpDetails() {
		return () => {
			return [
				text(
					'Play a game of Snake in the terminal. Try to eat as much food as possible without running into yourself or the walls.',
				),
				linebreak(1),
				text('Controls:'),
				indentation(2, [
					text('- Use arrow keys or W/A/S/D to change direction.'),
					linebreak(),
					text('- Press ESC to exit the game.'),
				]),
			];
		};
	},
};

export default snake;
