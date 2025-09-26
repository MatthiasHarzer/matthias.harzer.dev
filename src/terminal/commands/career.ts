import {
	type Command,
	highlight,
	hoverHighlightBlock,
	indentation,
	linebreak,
	link,
	paragraph,
	plainCommand,
	text,
} from '../command.ts';

const career: Command = {
	name: 'career',
	description: 'Displays my career so far.',
	prepare: plainCommand(() => {
		return [
			text("I'm studying at the "),
			link('Hochschule Karlsruhe', 'https://www.h-ka.de/', 'hka'),
			text(' and have been active as a working student:'),
			linebreak(1),
			indentation(2, [
				hoverHighlightBlock([
					paragraph([
						link('the native web GmbH', 'https://thenativeweb.io/', 'thenativeweb'),
						highlight(' (May 2024 - Jul 2025)', 'career-dates'),
					]),
					paragraph([
						text('Working student for back- & frontend development using '),
						link('Lit', 'https://lit.dev/', 'lit'),
						text(' and '),
						link('Go', 'https://go.dev/', 'go'),
						text(' with a focus on Event Sourcing, CQRS and Domain-Driven Design.'),
					]),
					paragraph([
						text('I was the primary engineer of '),
						link('EventQL', 'https://docs.eventsourcingdb.io/reference/eventql/', 'eventql'),
						text(', a self built query language of the '),
						link('EventSourcingDB', 'https://eventsourcingdb.io/', 'eventsourcingdb'),
						text('.'),
					]),
				]),
				linebreak(1),
				hoverHighlightBlock([
					paragraph([
						link('Karlsruhe Institute of Technology', 'https://www.kit.edu/', 'kit'),
						highlight(' (Jun 2023 - Feb 2024)', 'career-dates'),
					]),
					paragraph([
						text('Student assistant at the '),
						link(
							'Institute of Technology and Management in Construction',
							'https://www.tmb.kit.edu/',
							'tmb',
						),
						text('.'),
					]),
					paragraph([
						text('Development of the '),
						link(
							'Smart Readiness Indicator',
							'https://smartreadinessindicator.com/',
							'smartreadinessindicator',
						),
						text(' web platform using '),
						link('Vue', 'https://vuejs.org/', 'vue'),
						text(' and '),
						link('Node.js', 'https://nodejs.org/', 'node'),
						text('.'),
					]),
				]),
			]),
		];
	}),
};

export default career;
