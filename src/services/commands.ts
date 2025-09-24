import type { Terminal } from '../Terminal.ts';
import {
	button,
	type Command,
	type CommandResult,
	emoji,
	highlight,
	hoverHighlightBlock,
	indentation,
	linebreak,
	link,
	mentionCommandName,
	mentionCommandUsage,
	paragraph,
	type ResultItem,
	text,
} from './command-result.ts';
import { configService } from './config.ts';
import type { BaseObject } from './reactive-object.ts';

const $ = (fn: (...args: string[]) => CommandResult) => () => fn;

const basicCommandUsageDetails = (terminal: Terminal, command: Command): ResultItem[] => {
	return [
		mentionCommandName(terminal, command.name),
		text(' - '),
		text(command.description ?? 'No description available.'),
		linebreak(1),
		text('Usage: '),
		mentionCommandUsage(terminal, command, command.name),
	];
};

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

class HelpCommand implements Command {
	name = 'help';
	description = 'Lists all available commands.';
	isHidden = false;
	noHelp = false;

	#overview(terminal: Terminal): CommandResult {
		const commandItems: ResultItem[] = [text('Available commands:'), linebreak(1)];
		helpCommands.forEach((cmd, index) => {
			if (index > 0) {
				commandItems.push(linebreak());
			}
			commandItems.push(
				mentionCommandName(terminal, cmd.name),
				text(' - '),
				text(cmd.description ?? 'No description available.'),
			);
		});

		commandItems.push(
			linebreak(1),
			text('Type '),
			mentionCommandName(terminal, 'help <command>', 'help '),
			text(' to get more information about a specific command.'),
		);

		return commandItems;
	}

	async #details(terminal: Terminal, args: string[]): Promise<CommandResult | null> {
		if (args.length === 0) {
			return [];
		}

		const commandName = args[0];
		const remainingArgs = args.slice(1);
		const command = findCommand(commandName);
		if (!command) {
			return [highlight('error:', 'error'), text(` ${commandName}: command not found.`)];
		}

		if (command.provideHelpDetails) {
			const details = basicCommandUsageDetails(terminal, command);
			const execute = command.provideHelpDetails(terminal);

			const additionalDetails = await execute(...remainingArgs);
			if (additionalDetails === null || additionalDetails.length === 0) {
				return details;
			}

			return [...details, linebreak(1), ...additionalDetails];
		}

		return [
			...basicCommandUsageDetails(terminal, command),
			linebreak(1.5),
			text('No additional help available for this command.'),
		];
	}

	prepare(terminal: Terminal) {
		return async (...command: string[]) => {
			if (command.length === 0) {
				return this.#overview(terminal);
			}
			return await this.#details(terminal, command);
		};
	}

	provideHelpDetails(terminal: Terminal) {
		return (...args: string[]) => {
			if (args.length === 0) {
				return [
					text('Examples:'),
					linebreak(),
					indentation(2, [
						button('help', () => {
							terminal.pasteCommand('help');
						}),
						text(' - Lists all available commands.'),
						linebreak(),
						button('help config', () => {
							terminal.pasteCommand('help config');
						}),
						text(' - Displays detailed information about the "config" command.'),
					]),
				];
			}
			return [];
		};
	}
}

class ExitCommand implements Command {
	name = 'exit';
	description = 'Exits the terminal.';
	isHidden = true;
	noHelp = false;

	prepare(terminal: Terminal) {
		return async () => {
			const [response, success] = await terminal.prompt([
				text('Are you sure you want to exit? (y/n)'),
			]);
			if (success && ['y', 'yes'].includes(response.toLowerCase())) {
				terminal.hide();
			} else {
				return [text('Operation cancelled.')];
			}
			return null;
		};
	}

	provideHelpDetails() {
		return () => {
			return [
				text('Exits the terminal. You will be prompted for confirmation.'),
				linebreak(),
				text('To use the terminal again, refresh the page.'),
			];
		};
	}
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
	new HelpCommand(),
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
	new ExitCommand(),
	{
		name: 'config',
		description: 'Configure the terminal.',
		isHidden: true,
		noHelp: false,
		prepare:
			(terminal: Terminal) =>
			(action: string, key: string | null = null, value: string | null = null) => {
				if (!action) {
					return [text('Error: No action provided. Use "set", "get" or "list".')];
				}
				if (!['set', 'get', 'list'].includes(action)) {
					return [text(`Error: Unknown action "${action}". Use "set", "get" or "list".`)];
				}

				switch (action) {
					case 'list':
						return Object.keys(configService.value).flatMap((key, index) => {
							const value = (configService.value as BaseObject)[key];
							return [
								index > 0 ? linebreak() : null,
								button(key, () => {
									terminal.pasteCommand(`config set ${key} `);
								}),
								text(' = '),
								highlight(String(value), 'config-value'),
							].filter(item => item !== null);
						});
					case 'set': {
						if (key === null || value === null) {
							return [text('Error: No config key or value provided.')];
						}
						configService.setKeyValue(key, value);
						return [
							text(`Set config key "`),
							highlight(key, 'config-key'),
							text(`" to "`),
							highlight(String(value), 'config-value'),
							text(`".`),
						];
					}
					case 'get': {
						if (key === null) {
							return [text('Error: No config key provided.')];
						}
						const value = configService.getKeyValue(key);
						return [
							text(`Config key "`),
							highlight(key, 'config-key'),
							text(`" is set to "`),
							highlight(String(value), 'config-value'),
							text(`".`),
						];
					}
					default:
						return [text(`Error: Unknown action "${action}". Use "set", "get" or "list".`)];
				}
			},
		provideHelpDetails:
			(terminal: Terminal) =>
			(...args: string[]) => {
				switch (args.length) {
					case 0: {
						return [
							text('Actions:'),
							linebreak(),
							indentation(2, [
								button('list', () => {
									terminal.pasteCommand('config list');
								}),
								text(' - Lists all config keys and their values.'),
								linebreak(),
								button('get <key>', () => {
									terminal.pasteCommand('config get ');
								}),
								text(' - Gets the value of the specified config key.'),
								linebreak(),
								button('set <key> <value>', () => {
									terminal.pasteCommand('config set ');
								}),
								text(' - Sets the value of the specified config key.'),
							]),
							linebreak(1),
							text('Use '),
							mentionCommandName(terminal, 'help config <action>', 'help config '),
							text(' to get more information about a specific action.'),
						];
					}
					case 1: {
						switch (args[0]) {
							case 'set':
								return [
									text('Sets the value of a config key.'),
									linebreak(),
									text('Example: '),
									linebreak(),
									indentation(2, [
										mentionCommandName(
											terminal,
											'config set glowColor purple',
											'config set glowColor purple',
										),
										text(' - Sets the glow color of the terminal to purple.'),
									]),
								];
							case 'get':
								return [
									text('Gets the value of a config key.'),
									linebreak(),
									text('Example: '),
									linebreak(),
									indentation(2, [
										mentionCommandName(terminal, 'config get glowColor', 'config get glowColor'),
										text(' - Gets the glow color of the terminal.'),
									]),
								];
							case 'list':
								return [
									text('Lists all config keys and their values.'),
									linebreak(),
									text('Example: '),
									linebreak(),
									indentation(2, [
										mentionCommandName(terminal, 'config list', 'config list'),
										text(' - Lists all config keys and their values.'),
									]),
								];
							default:
								return [text(`Error: Unknown action "${args[0]}". Use "set", "get" or "list".`)];
						}
					}
					default:
						return [text('No additional help available for this action.')];
				}
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
