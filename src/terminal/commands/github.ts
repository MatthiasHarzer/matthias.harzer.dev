import { type Command, link, plainCommand, text } from '../command.ts';

const github: Command = {
	name: 'github',
	description: 'Link to my GitHub profile.',
	prepare: plainCommand(() => {
		return [
			text('You can find my project at '),
			link('github.com/MatthiasHarzer', 'https://github.com/MatthiasHarzer', 'github'),
			text('.'),
		];
	}),
};

export default github;
