import { type Command, indentation, linebreak, mentionCommandName, text } from '../terminal.ts';

const logo = String.raw`
 _____ ______   ___  ___
|\   _ \  _   \|\  \|\  \
\ \  \\\__\ \  \ \  \\\  \
 \ \  \\|__| \  \ \   __  \
  \ \  \    \ \  \ \  \ \  \
   \ \__\    \ \__\ \__\ \__\
    \|__|     \|__|\|__|\|__|
`;
const logoLines = logo
	.split('\n')
	.filter(line => line.trim() !== '')
	.map(line => line.replaceAll(' ', '\u00A0'))
	.flatMap(line => [text(line), linebreak()]);

const intro: Command = {
	name: 'intro',
	description: 'Introduction to the terminal',
	prepare: terminal => () => [
		...logoLines,
		linebreak(1),
		text('Welcome to my terminal! Here are some commands you can try:'),
		indentation(1, [
			text('- '),
			mentionCommandName(terminal, 'who'),
			text(': Learn more about me'),
			linebreak(),
			text('- '),
			mentionCommandName(terminal, 'career'),
			text(': See what I have done so far'),
			linebreak(),
			text('- '),
			mentionCommandName(terminal, 'pong'),
			text(': Play a game of pong'),
		]),
		linebreak(1),
		text('To get a full list of commands, type '),
		mentionCommandName(terminal, 'help'),
		text('.'),
		linebreak(1),
		text('Have fun exploring!'),
	],
};

export default intro;
