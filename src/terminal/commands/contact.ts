import { type Command, link, plainCommand, text } from '../command.ts';

const contact: Command = {
	name: 'contact',
	description: 'How to reach me.',
	prepare: plainCommand(() => {
		return [
			text('You can contact me via mail at '),
			link('matthias.harzer03@gmail.com', 'mailto:matthias.harzer03@gmail.com'),
			text('.'),
		];
	}),
};

export default contact;
