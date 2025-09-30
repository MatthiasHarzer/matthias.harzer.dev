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
} from '../terminal.ts';

const career: Command = {
	name: 'career',
	description: 'Displays my career so far',
	prepare: plainCommand(() => {
		return [
			text("I'm studying at the "),
			link('Hochschule Karlsruhe', 'https://www.h-ka.de/', 'hka'),
			text(' and have been active as a working student:'),
			linebreak(0.5),
			indentation(2, [
				hoverHighlightBlock([
					paragraph([
						link('Hochschule Karlsruhe', 'https://www.h-ka.de/', 'hka'),
						highlight(' (since Oct 2025)', 'career-dates'),
					]),
					paragraph([
						text('Student assistant at the '),
						link('Intelligent Systems Research Group', 'https://www.h-ka.de/isrg', 'isrg'),
						text('.'),
					]),
					paragraph([
						text('Development of the front- and backend of the '),
						link('SimpleAgriData', 'https://simple-agri-data.de/', 'simpleagridata'),
						text(' web app using '),
						link('Python', 'https://www.python.org/', 'python'),
						text(' and '),
						link('React', 'https://reactjs.org/', 'react'),
						text('.'),
					]),
				]),
				linebreak(0.5),
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
						text(' with a focus on '),
						link(
							'Event Sourcing',
							'https://docs.eventsourcingdb.io/about-eventsourcingdb/introduction-to-event-sourcing/',
							'eventsourcing',
						),
						text(', '),
						link('CQRS', 'https://www.cqrs.com/concepts/cqrs/', 'cqrs'),
						text(' and '),
						link('Domain-Driven Design', 'https://www.domainlanguage.com/ddd/', 'ddd'),
						text('.'),
					]),
					paragraph([
						text('I was the primary engineer of '),
						link('EventQL', 'https://docs.eventsourcingdb.io/reference/eventql/', 'eventql'),
						text(', a self built query language of the '),
						link('EventSourcingDB', 'https://eventsourcingdb.io/', 'eventsourcingdb'),
						text('.'),
					]),
				]),
				linebreak(0.5),
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
