import type { TemplateResult } from 'lit';
import { getFunctionParameters, paramsToString } from '../services/function-params.ts';
import type { Terminal } from '../Terminal.ts';

interface TerminalPart {
	type:
		| 'text'
		| 'highlight'
		| 'link'
		| 'linebreak'
		| 'button'
		| 'paragraph'
		| 'indentation'
		| 'hover-highlight-block'
		| 'emoji'
		| 'component';
}

interface TerminalText extends TerminalPart {
	type: 'text';
	text: string;
}

interface TerminalHighlight extends TerminalPart {
	type: 'highlight';
	text: string;
	highlightType?: string;
}

interface TerminalLink extends TerminalPart {
	type: 'link';
	text: string;
	href: string;
	highlightType?: string;
}

interface TerminalLinebreak extends TerminalPart {
	type: 'linebreak';
	height?: number; // in em
}

interface TerminalButton extends TerminalPart {
	type: 'button';
	text: string;
	highlightType?: string;
	action: () => void;
}

interface TerminalParagraph extends TerminalPart {
	type: 'paragraph';
	parts: TerminalItem[];
}

interface TerminalIndentation extends TerminalPart {
	type: 'indentation';
	level: number; // number of indentation levels (1 level = 4 spaces)
	parts: TerminalItem[];
}

interface TerminalHoverHighlightBlock extends TerminalPart {
	type: 'hover-highlight-block';
	parts: TerminalItem[];
}

interface TerminalEmoji extends TerminalPart {
	type: 'emoji';
	emoji: string; // the emoji character
}

interface TerminalComponent extends TerminalPart {
	type: 'component';
	component: TemplateResult; // a Lit template
}

type TerminalItem =
	| TerminalText
	| TerminalHighlight
	| TerminalLink
	| TerminalLinebreak
	| TerminalButton
	| TerminalParagraph
	| TerminalIndentation
	| TerminalHoverHighlightBlock
	| TerminalEmoji
	| TerminalComponent;

type TerminalResponse = TerminalItem[];

type TerminalFunction = (
	...args: string[]
) => TerminalResponse | null | Promise<TerminalResponse | null>;

interface Command {
	name: string;
	description: string;
	prepare(terminal: Terminal): TerminalFunction;
	isHidden?: boolean;
	noHelp?: boolean;
	provideHelpDetails?(terminal: Terminal): TerminalFunction;
}

const text = (text: string): TerminalText => ({ type: 'text', text });
const highlight = (text: string, highlightType?: string): TerminalHighlight => ({
	type: 'highlight',
	text,
	highlightType,
});
const link = (text: string, href: string, highlightType?: string): TerminalLink => ({
	type: 'link',
	text,
	href,
	highlightType,
});
const linebreak = (height?: number): TerminalLinebreak => ({ type: 'linebreak', height });
const button = (text: string, action: () => void, highlightType?: string): TerminalButton => ({
	type: 'button',
	text,
	action,
	highlightType,
});
const paragraph = (parts: TerminalItem[]): TerminalParagraph => ({ type: 'paragraph', parts });
const indentation = (level: number, parts: TerminalItem[]): TerminalIndentation => ({
	type: 'indentation',
	level,
	parts,
});
const hoverHighlightBlock = (parts: TerminalItem[]): TerminalHoverHighlightBlock => ({
	type: 'hover-highlight-block',
	parts,
});
const emoji = (emoji: string): TerminalEmoji => ({ type: 'emoji', emoji });

const mentionCommandName = (
	terminal: Terminal,
	commandName: string,
	insertText?: string,
): TerminalButton =>
	button(
		commandName,
		() => {
			terminal.pasteCommand(insertText ?? commandName);
		},
		'command',
	);

const mentionCommandUsage = (
	terminal: Terminal,
	command: Command,
	insertText?: string,
): TerminalButton => {
	const params = getFunctionParameters(command.prepare(terminal));
	const paramsString = paramsToString(params);
	const completeCommand = `${command.name} ${paramsString}`.trim();
	return button(
		completeCommand,
		() => {
			terminal.pasteCommand(insertText ?? completeCommand);
		},
		'command',
	);
};

const component = (component: TemplateResult): TerminalComponent => ({
	type: 'component',
	component,
});

const plainCommand = (fn: (...args: string[]) => TerminalResponse) => () => fn;

export {
	button,
	component,
	emoji,
	highlight,
	hoverHighlightBlock,
	indentation,
	linebreak,
	link,
	mentionCommandName,
	mentionCommandUsage,
	paragraph,
	plainCommand,
	text,
};
export type {
	Command,
	TerminalButton,
	TerminalComponent,
	TerminalEmoji,
	TerminalFunction,
	TerminalHighlight,
	TerminalHoverHighlightBlock,
	TerminalIndentation,
	TerminalItem,
	TerminalLinebreak,
	TerminalLink,
	TerminalParagraph,
	TerminalResponse,
	TerminalText,
};
