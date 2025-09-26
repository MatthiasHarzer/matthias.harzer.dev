import { type Command, type TerminalFunction, text } from '../../terminal.ts';

class PongCommand implements Command {
	name = 'pong';
	description = 'Play a game of pong';
	prepare(): TerminalFunction {
		return () => {
			return [text('pong')];
		};
	}
}

const pong: Command = new PongCommand();

export default pong;
