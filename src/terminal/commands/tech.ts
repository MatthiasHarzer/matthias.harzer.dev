import { type Command, link, plainCommand, text } from '../command.ts';

const tech: Command = {
	name: 'tech',
	description: 'Lists technologies, I use for development.',
	prepare: plainCommand(() => {
		return [
			text('I have experience in building frontend applications with '),
			link('Lit', 'https://lit.dev/', 'lit'),
			text(', '),
			link('Svelte', 'https://svelte.dev/', 'svelte'),
			text(', '),
			link('Vue', 'https://vuejs.org/', 'vue'),
			text(' and '),
			link('Flutter', 'https://flutter.dev/', 'flutter'),
			text(' and backend applications with '),
			link('Go', 'https://go.dev/', 'go'),
			text(', '),
			link('Node.js', 'https://nodejs.org/', 'node'),
			text(', '),
			link('Python', 'https://www.python.org/', 'python'),
			text(', and a bit '),
			link('Java', 'https://www.java.com/', 'java'),
			text(' and '),
			link('C#', 'https://dotnet.microsoft.com/en-us/languages/csharp/', 'cs'),
			text('.'),
		];
	}),
};

export default tech;
