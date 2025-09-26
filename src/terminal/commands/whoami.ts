import type { Terminal } from '../../Terminal.ts';
import { button, type Command, link, text } from '../command.ts';
import { visibleCommands } from '../commands.ts';

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

const whoami: Command = new WhoamiCommand();

export default whoami;
