import { type Command, highlight, link, plainCommand, text } from '../terminal.ts';

const who: Command = {
	name: 'who',
	description: 'Displays information about me',
	prepare: plainCommand(() => {
		const birthday = new Date(2002, 10, 3);
		const now = new Date();
		let age = now.getFullYear() - birthday.getFullYear();
		if (
			now.getMonth() < birthday.getMonth() ||
			(now.getMonth() === birthday.getMonth() && now.getDate() < birthday.getDate())
		) {
			age--;
		}

		return [
			text(`Hi, I'm `),
			highlight('Matthias'),
			text(`, a ${age} y/o software engineering student from `),
			link('Karlsruhe', 'https://www.google.com/maps/place/Karlsruhe/'),
			text(", Germany. I'm passionate about "),
			highlight('web development and design'),
			text('.'),
		];
	}),
};

export default who;
