import type { Terminal } from '../../Terminal.ts';
import { findCommand, helpCommands } from '../commands.ts';
import {
	type Command,
	highlight,
	indentation,
	linebreak,
	mentionCommandName,
	mentionCommandUsage,
	type TerminalItem,
	type TerminalResponse,
	text,
} from '../terminal.ts';

const basicCommandUsageDetails = (terminal: Terminal, command: Command): TerminalItem[] => {
	return [
		mentionCommandName(terminal, command.name),
		text(' - '),
		text(command.description ?? 'No description available.'),
		linebreak(1),
		text('Usage: '),
		mentionCommandUsage(terminal, command, command.name),
	];
};

class HelpCommand implements Command {
	name = 'help';
	description = 'Lists all available commands';
	isHidden = false;
	noHelp = false;
	allCommands: Command[] = [];

	setAllCommands(commands: Command[]) {
		this.allCommands = commands;
	}

	#findCommand(commandName: string): Command | null {
		return (
			this.allCommands.find(cmd => cmd.name.toLowerCase() === commandName.toLowerCase()) ?? null
		);
	}

	#overview(terminal: Terminal): TerminalResponse {
		const commandItems: TerminalItem[] = [text('Available commands:'), linebreak(1)];
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

	async #details(terminal: Terminal, args: string[]): Promise<TerminalResponse | null> {
		if (args.length === 0) {
			return [];
		}

		const commandName = args[0];
		const remainingArgs = args.slice(1);
		const command = findCommand(commandName);
		if (!command) {
			return [highlight('error:', 'error'), text(` ${commandName}: command not found.`)];
		}

		const basicDetails = basicCommandUsageDetails(terminal, command);
		if (command.provideHelpDetails) {
			const execute = command.provideHelpDetails(terminal);

			const additionalDetails = await execute(...remainingArgs);
			if (additionalDetails === null || additionalDetails.length === 0) {
				return basicDetails;
			}

			return [...basicDetails, linebreak(1), ...additionalDetails];
		}

		return [
			...basicDetails,
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
						mentionCommandName(terminal, 'help', 'help'),
						text(' - Lists all available commands.'),
						linebreak(),
						mentionCommandName(terminal, 'help config', 'help config'),
						text(' - Displays detailed information about the "config" command.'),
					]),
				];
			}
			return [];
		};
	}

	async provideSuggestions(...args: string[]): Promise<string[]> {
		if (args.length === 0) {
			return this.allCommands.map(cmd => cmd.name);
		}

		const subCommand = this.#findCommand(args[0]);
		if (!subCommand) {
			const prefix = args[0].toLowerCase();
			return this.allCommands
				.map(cmd => cmd.name)
				.filter(name => name.toLowerCase().startsWith(prefix));
		}

		const commandArgs = args.toSpliced(0, 1);
		if (!subCommand.provideSuggestions) return [];

		const subCommandSuggestions = await subCommand.provideSuggestions(...commandArgs);

		return subCommandSuggestions.map(s => `${subCommand.name} ${s}`);
	}
}

const help = new HelpCommand();

export default help;
