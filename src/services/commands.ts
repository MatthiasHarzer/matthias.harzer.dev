import type { Terminal } from '../Terminal.ts';

interface ResultPart {
	type: 'text' | 'highlight' | 'link' | 'linebreak' | 'button';
}

interface ResultText extends ResultPart {
	type: 'text';
	text: string;
}

interface ResultHighlight extends ResultPart {
	type: 'highlight';
	text: string;
	highlightType?: string;
}

interface ResultLink extends ResultPart {
	type: 'link';
	text: string;
	href: string;
	highlightType?: string;
}

interface ResultLinebreak extends ResultPart {
	type: 'linebreak';
}

interface ResultButton extends ResultPart {
	type: 'button';
	text: string;
	highlightType?: string;
	action: (terminal: Terminal) => void;
}

type ResultItem = ResultText | ResultHighlight | ResultLink | ResultLinebreak | ResultButton;

type CommandResult = ResultItem[];

interface Command {
	name: string;
	description: string;
	execute: (...args: string[]) => CommandResult;
	isHidden?: boolean;
	noHelp?: boolean;
}

const text = (text: string): ResultText => ({ type: 'text', text });
const highlight = (text: string, highlightType?: string): ResultHighlight => ({
	type: 'highlight',
	text,
	highlightType,
});
const link = (text: string, href: string, highlightType?: string): ResultLink => ({
	type: 'link',
	text,
	href,
	highlightType,
});
const linebreak = (): ResultLinebreak => ({ type: 'linebreak' });
const button = (text: string, action: (terminal: Terminal) => void): ResultButton => ({
	type: 'button',
	text,
	action,
});

const commands: Command[] = [
	{
		name: 'who',
		description: 'Displays information about the site owner.',
		execute: () => {
			const birthday = new Date(2002, 10, 3);
			const now = new Date();
			let age = now.getFullYear() - birthday.getFullYear();
			if (
				now.getMonth() < birthday.getMonth() ||
				(now.getMonth() === birthday.getMonth() && now.getDate() < birthday.getDate())
			) {
				age--;
			}

			return [
				text("Hi, I'm "),
				highlight('Matthias'),
				text(`, a ${age} y/o software engineering student from `),
				link('Karlsruhe', 'https://www.google.com/maps/place/Karlsruhe/'),
				text(", Germany. I'm passionate about "),
				highlight('web development and design'),
				text('.'),
			];
		},
	},
];

const findCommand = (name: string): Command | undefined => {
	return commands.find(cmd => cmd.name.toLowerCase() === name.toLowerCase());
};

const commandNotFound = (command: string) => [
	highlight('error:', 'error'),
	text(` ${command}: command not found.`),
];

export { commandNotFound, commands, findCommand };
export type { Command, CommandResult, ResultItem };
