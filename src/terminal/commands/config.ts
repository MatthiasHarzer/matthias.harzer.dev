import { configService } from '../../services/config.ts';
import type { BaseObject } from '../../services/reactive-object.ts';
import type { Terminal } from '../../Terminal.ts';
import { treeSuggestions } from '../suggestionsutil.ts';
import {
	button,
	type Command,
	highlight,
	indentation,
	linebreak,
	mentionCommandName,
	text,
} from '../terminal.ts';

const configKeys = Object.keys(configService.value);

const suggestionsTree = {
	set: Object.fromEntries(configKeys.map(key => [key, {}])),
	get: Object.fromEntries(configKeys.map(key => [key, {}])),
	list: {},
};

const config: Command = {
	name: 'config',
	description: 'Configure the terminal',
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
							button(
								key,
								() => {
									terminal.pasteCommand(`config set ${key} `);
								},
								'config-key',
							),
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
						text(`Set config key `),
						highlight(key, 'config-key'),
						text(` to `),
						highlight(String(value), 'config-value'),
						text(`.`),
					];
				}
				case 'get': {
					if (key === null) {
						return [text('Error: No config key provided.')];
					}
					const value = configService.getKeyValue(key);
					return [
						text(`Config key `),
						highlight(key, 'config-key'),
						text(` is set to `),
						highlight(String(value), 'config-value'),
						text(`.`),
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
							mentionCommandName(terminal, 'config list', 'config list'),
							text(' - Lists all config keys and their values.'),
							linebreak(),
							mentionCommandName(terminal, 'config get <key>', 'config get '),
							text(' - Gets the value of the specified config key.'),
							linebreak(),
							mentionCommandName(terminal, 'config set <key> <value>', 'config set '),
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
	provideSuggestions: treeSuggestions(suggestionsTree),
};

export default config;
