import type { Terminal } from '../Terminal.ts';

interface ResultPart {
	type:
		| 'text'
		| 'highlight'
		| 'link'
		| 'linebreak'
		| 'button'
		| 'paragraph'
		| 'indentation'
		| 'hover-highlight-block'
		| 'emoji';
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
	height?: number; // in em
}

interface ResultButton extends ResultPart {
	type: 'button';
	text: string;
	highlightType?: string;
	action: () => void;
}

interface ResultParagraph extends ResultPart {
	type: 'paragraph';
	parts: ResultItem[];
}

interface ResultIndentation extends ResultPart {
	type: 'indentation';
	level: number; // number of indentation levels (1 level = 4 spaces)
	parts: ResultItem[];
}

interface ResultHoverHighlightBlock extends ResultPart {
	type: 'hover-highlight-block';
	parts: ResultItem[];
}

interface ResultEmoji extends ResultPart {
	type: 'emoji';
	emoji: string; // the emoji character
}

type ResultItem =
	| ResultText
	| ResultHighlight
	| ResultLink
	| ResultLinebreak
	| ResultButton
	| ResultParagraph
	| ResultIndentation
	| ResultHoverHighlightBlock
	| ResultEmoji;

type CommandResult = ResultItem[];

interface Command {
	name: string;
	description: string;
	prepare: (terminal: Terminal) => (...args: string[]) => CommandResult | null;
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
const linebreak = (height?: number): ResultLinebreak => ({ type: 'linebreak', height });
const button = (text: string, action: () => void): ResultButton => ({
	type: 'button',
	text,
	action,
});
const paragraph = (parts: ResultItem[]): ResultParagraph => ({ type: 'paragraph', parts });
const indentation = (level: number, parts: ResultItem[]): ResultIndentation => ({
	type: 'indentation',
	level,
	parts,
});
const hoverHighlightBlock = (parts: ResultItem[]): ResultHoverHighlightBlock => ({
	type: 'hover-highlight-block',
	parts,
});
const emoji = (emoji: string): ResultEmoji => ({ type: 'emoji', emoji });

const $ = (fn: (...args: string[]) => CommandResult) => () => fn;

class WhoamiCommand implements Command {
	name = 'whoami';
	description = 'What do you think?';
	isHidden = false;
	noHelp = false;

	#counter = 0;

	prepare = (terminal: Terminal) => {
		return () => {
			this.#counter++;
			switch (this.#counter) {
				case 1:
					return [text(`I'm a terminal, what do you expect me to do? Try again.`)];
				case 2:
					return [text(`I already told you, I'm a terminal. Try something else.`)];
				case 3:
					return [text(`Stop it.`)];
				case 4: {
					const availableCommands = visibleCommands.filter(
						cmd => !['help', 'whoami'].includes(cmd.name),
					);
					const randomCommand =
						availableCommands[Math.floor(Math.random() * availableCommands.length)];
					return [
						text(`Are you looking for the `),
						button(randomCommand.name, () => {
							terminal.pasteCommand(randomCommand.name);
							terminal.focusInput();
						}),
						text(` command?`),
					];
				}
				case 5:
					return [
						text(`Alright, alright. You can find my source code at `),
						link(
							'github.com/MatthiasHarzer/matthias.harzer.dev',
							'https://github.com/MatthiasHarzer/matthias.harzer.dev',
						),
						text(`. Happy now?`),
					];
				default:
					this.#counter = 0;
					return [text(`I'm not going to tell you again.`)];
			}
		};
	};
}

const commands: Command[] = [
	{
		name: 'who',
		description: 'Displays information about me.',
		prepare: $(() => {
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
		}),
	},
	{
		name: 'tech',
		description: 'Lists technologies, I use for development.',
		prepare: $(() => {
			return [
				text('I have experience in building frontend applications with '),
				link('Lit', 'https://lit.dev/', 'lit'),
				text(', '),
				link('Svelte', 'https://svelte.dev/', 'svelte'),
				text(', '),
				link('Vue', 'https://vuejs.org/', 'vue'),
				text(' and '),
				link('Flutter', 'https://flutter.dev/', 'flutter'),
				text(' and backend applications with '),
				link('Go', 'https://go.dev/', 'go'),
				text(', '),
				link('Node.js', 'https://nodejs.org/', 'node'),
				text(', '),
				link('Python', 'https://www.python.org/', 'python'),
				text(', and a bit '),
				link('Java', 'https://www.java.com/', 'java'),
				text(' and '),
				link('C#', 'https://dotnet.microsoft.com/en-us/languages/csharp/', 'cs'),
				text('.'),
			];
		}),
	},
	{
		name: 'career',
		description: 'Displays my career so far.',
		prepare: $(() => {
			return [
				text("I'm studying at the "),
				link('Hochschule Karlsruhe', 'https://www.h-ka.de/', 'hka'),
				text(' and have been active as a working student:'),
				linebreak(1),
				indentation(2, [
					hoverHighlightBlock([
						paragraph([
							link('the native web GmbH', 'https://thenativeweb.io/', 'thenativeweb'),
							highlight(' (May 2024 - Jul 2025)', 'career-dates'),
						]),
						paragraph([
							text('Working student for back- & frontend development using '),
							link('Lit', 'https://lit.dev/', 'lit'),
							text(' and '),
							link('Go', 'https://go.dev/', 'go'),
							text(' with a focus on Event Sourcing, CQRS and Domain-Driven Design.'),
						]),
						paragraph([
							text('I was the primary engineer of '),
							link('EventQL', 'https://docs.eventsourcingdb.io/reference/eventql/', 'eventql'),
							text(', a self built query language of the '),
							link('EventSourcingDB', 'https://eventsourcingdb.io/', 'eventsourcingdb'),
							text('.'),
						]),
					]),
					linebreak(1),
					hoverHighlightBlock([
						paragraph([
							link('Karlsruhe Institute of Technology', 'https://www.kit.edu/', 'kit'),
							highlight(' (Jun 2023 - Feb 2024)', 'career-dates'),
						]),
						paragraph([
							text('Student assistant at the '),
							link(
								'Institute of Technology and Management in Construction',
								'https://www.tmb.kit.edu/',
								'tmb',
							),
							text('.'),
						]),
						paragraph([
							text('Development of the '),
							link(
								'Smart Readiness Indicator',
								'https://smartreadinessindicator.com/',
								'smartreadinessindicator',
							),
							text(' web platform using '),
							link('Vue', 'https://vuejs.org/', 'vue'),
							text(' and '),
							link('Node.js', 'https://nodejs.org/', 'node'),
							text('.'),
						]),
					]),
				]),
			];
		}),
	},
	{
		name: 'github',
		description: 'Link to my GitHub profile.',
		prepare: $(() => {
			return [
				text('You can find my project at '),
				link('github.com/MatthiasHarzer', 'https://github.com/MatthiasHarzer', 'github'),
				text('.'),
			];
		}),
	},
	{
		name: 'contact',
		description: 'How to reach me.',
		prepare: $(() => {
			return [
				text('You can contact me via mail at '),
				link('matthias.harzer03@gmail.com', 'mailto:matthias.harzer03@gmail.com'),
				text('.'),
			];
		}),
	},
	{
		name: 'help',
		description: 'Lists all available commands.',
		prepare: terminal => () => {
			helpCommands;
			const commandItems: ResultItem[] = [];
			helpCommands.forEach((cmd, index) => {
				if (index > 0) {
					commandItems.push(linebreak());
				}
				commandItems.push(
					button(cmd.name, () => {
						terminal.pasteCommand(cmd.name);
						terminal.focusInput();
					}),
					text(' - '),
					text(cmd.description ?? 'No description available.'),
				);
			});
			return commandItems;
		},
	},
	{
		name: 'clear',
		description: 'Clears the terminal.',
		prepare: (terminal: Terminal) => {
			return () => {
				terminal.clear();
				return null;
			};
		},
	},
	new WhoamiCommand(),
	{
		name: 'mh',
		description: 'Secret command.',
		isHidden: true,
		noHelp: true,
		prepare: () => () => [
			text('You found the secret command '),
			emoji('🎉'),
			text(`, but I haven't implemented it yet.`),
		],
	},
	{
		name: 'exit',
		description: 'Exits the terminal.',
		isHidden: true,
		noHelp: false,
		prepare: (terminal: Terminal) => () => {
			terminal.hide();
			return null;
		},
	},
];
commands.sort((a, b) => a.name.localeCompare(b.name));

const visibleCommands = commands.filter(cmd => !cmd.isHidden);
const helpCommands = commands.filter(cmd => !cmd.noHelp);

const findCommand = (name: string): Command | undefined => {
	return commands.find(cmd => cmd.name.toLowerCase() === name.toLowerCase());
};

const commandNotFound = (command: string) => [
	highlight('error:', 'error'),
	text(` ${command}: command not found.`),
];

export { commandNotFound, commands, findCommand, helpCommands, visibleCommands };
export type { Command, CommandResult, ResultItem };
