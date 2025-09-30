import career from './commands/career.ts';
import clear from './commands/clear.ts';
import config from './commands/config.ts';
import contact from './commands/contact.ts';
import exit from './commands/exit.ts';
import github from './commands/github.ts';
import help from './commands/help.ts';
import mh from './commands/mh.ts';
import pong from './commands/pong/pong.ts';
import snake from './commands/snake/snake.ts';
import tech from './commands/tech.ts';
import who from './commands/who.ts';
import whoami from './commands/whoami.ts';
import { type Command, highlight, text } from './terminal.ts';

// biome-ignore format: Force vertical list for easier reading / reordering
const commands = [
	who,
	tech,
	career,
	contact,
	github,
	help,
	clear,
	config,
	whoami,
	exit,
	mh,
	pong,
	snake,
];

const visibleCommands = commands.filter(cmd => !cmd.isHidden);
const helpCommands = commands.filter(cmd => !cmd.noHelp);

const findCommand = (name: string): Command | undefined => {
	return commands.find(cmd => cmd.name.toLowerCase() === name.toLowerCase());
};

const commandNotFound = (command: string) => [
	highlight('error:', 'error'),
	text(` ${command}: command not found.`),
];

export { commandNotFound, findCommand, helpCommands, visibleCommands };
