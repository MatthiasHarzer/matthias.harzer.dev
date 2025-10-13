type SuggestionFunction = (...args: string[]) => string[];

type CommandTree = {
	[key: string]: string[] | CommandTree;
};

const resolve = (node: CommandTree, key: string): string[] | CommandTree | null => {
	const keys = Object.keys(node);

	// This will prevent O(1) lookups, but allows for case-insensitive matching
	// which is more user-friendly in a terminal context
	for (const k of keys) {
		if (k.toLowerCase() === key.toLowerCase()) {
			return node[k];
		}
	}
	return null;
};

const suggestKeys = (node: CommandTree, key: string): string[] => {
	const keys = Object.keys(node);
	return keys.filter(k => k.toLowerCase().startsWith(key.toLowerCase()));
};

const getSuggestions = (tree: CommandTree, ...args: string[]): [string, string[]] => {
	let node: CommandTree = tree;
	const path: string[] = [];

	for (const arg of args) {
		const nextNode = resolve(node, arg);
		if (!nextNode) {
			return [path.join(' '), suggestKeys(node, arg)];
		}
		path.push(arg);
		if (Array.isArray(nextNode)) {
			return [path.join(' '), nextNode];
		} else {
			node = nextNode;
		}
	}

	return [path.join(' '), Object.keys(node)];
};

const treeSuggestions = (commandTree: CommandTree): SuggestionFunction => {
	return (...args) => {
		const [pathStr, suggestions] = getSuggestions(commandTree, ...args);

		return suggestions.map(s => `${pathStr} ${s}`.trim());
	};
};

export { treeSuggestions };
