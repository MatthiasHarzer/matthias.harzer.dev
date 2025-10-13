import { parseCommand } from '../services/parse-command.ts';
import { prependEvery } from '../services/stringutil.ts';
import { commands, findCommand } from './commands.ts';

const commandNames = Object.keys(commands) as (keyof typeof commands)[];

const getSuggestions = async (input: string): Promise<string[]> => {
	const { command: commandName, args } = parseCommand(input);

	const command = findCommand(commandName);
	if (!command) {
		return commandNames.filter(name => name.startsWith(commandName));
	}

	if (!command.provideSuggestions) return [];

	const suggestions = await command.provideSuggestions(...args);

	return prependEvery(`${command.name} `, suggestions);
};

export { getSuggestions };
