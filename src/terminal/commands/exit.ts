import type { Terminal } from '../../Terminal.ts';
import { type Command, linebreak, text } from '../terminal.ts';

class ExitCommand implements Command {
	name = 'exit';
	description = 'Exits the terminal';
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

const exit: Command = new ExitCommand();

export default exit;
