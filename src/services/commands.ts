import { html, type TemplateResult } from 'lit';

// 1 correlates to lit's TemplateResult type of an HTML template
type CommandResult = TemplateResult<1>;
interface Command {
	name: string;
	description: string;
	execute: (...args: string[]) => CommandResult;
	isHidden?: boolean;
	noHelp?: boolean;
}

const commands: Command[] = [
	{
		name: 'who',
		description: 'Displays information about the site owner.',
		execute: () => {
			const birthday = new Date(2002, 10, 3);
			const now = new Date();
			let age = now.getFullYear() - birthday.getFullYear();
			if (
				now.getMonth() < birthday.getMonth() ||
				(now.getMonth() === birthday.getMonth() && now.getDate() < birthday.getDate())
			) {
				age--;
			}

			return html`Hi, I'm <span class='highlight'>Matthias</span>, a ${age} y/o software engineering student from <a href='https://www.google.com/maps/place/Karlsruhe/' class='highlight'>Karlsruhe</a>, Germany.
						I'm passionate about <span class='highlight'>web development and design</span>.`;
		},
	},
];

const findCommand = (name: string): Command | undefined => {
	return commands.find(cmd => cmd.name.toLowerCase() === name.toLowerCase());
};

const commandNotFound: CommandResult = html`<span class="highlight error">Error:</span> Command not found.`;

export { commandNotFound, commands, findCommand };
export type { Command, CommandResult };
