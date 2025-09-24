import type { Terminal } from '../Terminal.ts';
import { getFunctionParameters, paramsToString } from './function-params.ts';

interface ResultPart {
	type:
		| 'text'
		| 'highlight'
		| 'link'
		| 'linebreak'
		| 'button'
		| 'paragraph'
		| 'indentation'
		| 'hover-highlight-block'
		| 'emoji';
}

interface ResultText extends ResultPart {
	type: 'text';
	text: string;
}

interface ResultHighlight extends ResultPart {
	type: 'highlight';
	text: string;
	highlightType?: string;
}

interface ResultLink extends ResultPart {
	type: 'link';
	text: string;
	href: string;
	highlightType?: string;
}

interface ResultLinebreak extends ResultPart {
	type: 'linebreak';
	height?: number; // in em
}

interface ResultButton extends ResultPart {
	type: 'button';
	text: string;
	highlightType?: string;
	action: () => void;
}

interface ResultParagraph extends ResultPart {
	type: 'paragraph';
	parts: ResultItem[];
}

interface ResultIndentation extends ResultPart {
	type: 'indentation';
	level: number; // number of indentation levels (1 level = 4 spaces)
	parts: ResultItem[];
}

interface ResultHoverHighlightBlock extends ResultPart {
	type: 'hover-highlight-block';
	parts: ResultItem[];
}

interface ResultEmoji extends ResultPart {
	type: 'emoji';
	emoji: string; // the emoji character
}

type ResultItem =
	| ResultText
	| ResultHighlight
	| ResultLink
	| ResultLinebreak
	| ResultButton
	| ResultParagraph
	| ResultIndentation
	| ResultHoverHighlightBlock
	| ResultEmoji;

type CommandResult = ResultItem[];

type CommandExecuteFunction = (
	...args: string[]
) => CommandResult | null | Promise<CommandResult | null>;

type PrepareCommandFunction = (terminal: Terminal) => CommandExecuteFunction;

interface Command {
	name: string;
	description: string;
	prepare: PrepareCommandFunction;
	isHidden?: boolean;
	noHelp?: boolean;
	provideHelpDetails?: PrepareCommandFunction;
}

const text = (text: string): ResultText => ({ type: 'text', text });
const highlight = (text: string, highlightType?: string): ResultHighlight => ({
	type: 'highlight',
	text,
	highlightType,
});
const link = (text: string, href: string, highlightType?: string): ResultLink => ({
	type: 'link',
	text,
	href,
	highlightType,
});
const linebreak = (height?: number): ResultLinebreak => ({ type: 'linebreak', height });
const button = (text: string, action: () => void, highlightType?: string): ResultButton => ({
	type: 'button',
	text,
	action,
	highlightType,
});
const paragraph = (parts: ResultItem[]): ResultParagraph => ({ type: 'paragraph', parts });
const indentation = (level: number, parts: ResultItem[]): ResultIndentation => ({
	type: 'indentation',
	level,
	parts,
});
const hoverHighlightBlock = (parts: ResultItem[]): ResultHoverHighlightBlock => ({
	type: 'hover-highlight-block',
	parts,
});
const emoji = (emoji: string): ResultEmoji => ({ type: 'emoji', emoji });

const mentionCommandName = (
	terminal: Terminal,
	command: Command,
	displayText?: string,
): ResultButton =>
	button(
		displayText ?? command.name,
		() => {
			terminal.pasteCommand(command.name);
		},
		'command',
	);

const mentionCommandUsage = (terminal: Terminal, command: Command): ResultButton => {
	const params = getFunctionParameters(command.prepare(terminal));
	const paramsString = paramsToString(params);
	const completeCommand = `${command.name} ${paramsString}`.trim();
	return button(
		completeCommand,
		() => {
			terminal.pasteCommand(completeCommand);
		},
		'command',
	);
};

export {
	button,
	emoji,
	highlight,
	hoverHighlightBlock,
	indentation,
	linebreak,
	link,
	mentionCommandName,
	mentionCommandUsage,
	paragraph,
	text,
};
export type {
	Command,
	CommandExecuteFunction,
	CommandResult,
	ResultButton,
	ResultEmoji,
	ResultHighlight,
	ResultHoverHighlightBlock,
	ResultIndentation,
	ResultItem,
	ResultLinebreak,
	ResultLink,
	ResultParagraph,
	ResultText,
};
