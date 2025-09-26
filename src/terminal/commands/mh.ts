import { type Command, emoji, text } from '../terminal.ts';

const mh: Command = {
	name: 'mh',
	description: 'Secret command',
	isHidden: true,
	noHelp: true,
	prepare: () => () => [
		text('You found the secret command '),
		emoji('🎉'),
		text(`, but I haven't implemented it yet :/`),
	],
};

export default mh;
