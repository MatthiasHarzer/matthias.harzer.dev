import { parseCommand } from '../services/parse-command.ts';
import { commands, findCommand } from './commands.ts';

const commandNames = Object.keys(commands) as (keyof typeof commands)[];

const getSuggestions = (input: string): string[] => {
	const { command: commandName, args } = parseCommand(input);
	if (args.length > 0) return [];

	const command = findCommand(commandName);
	if (command) return [];

	return commandNames.filter(name => name.startsWith(commandName));
};

export { getSuggestions };
