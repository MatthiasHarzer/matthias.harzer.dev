import type { Terminal } from '../../Terminal.ts';
import type { Command } from '../command.ts';

const clear: Command = {
	name: 'clear',
	description: 'Clears the terminal.',
	prepare: (terminal: Terminal) => {
		return () => {
			terminal.clear();
			return null;
		};
	},
};

export default clear;
