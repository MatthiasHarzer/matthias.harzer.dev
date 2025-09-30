import { html } from 'lit';
import { type Command, component } from '../../terminal.ts';

const snake: Command = {
	name: 'snake',
	description: 'Play a game of Snake',
	prepare(terminal) {
		return () => {
			terminal.disableInput();
			return [component(html`<mh-terminal-snake .terminal=${terminal}></mh-terminal-snake>`)];
		};
	},
};

export default snake;
