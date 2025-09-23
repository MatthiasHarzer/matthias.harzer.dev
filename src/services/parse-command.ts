const prevChar = (str: string, index: number): string | null => {
	if (index <= 0 || index > str.length) {
		return null;
	}
	return str[index - 1];
};

const parseCommand = (input: string): { command: string; args: string[] } => {
	const parts: string[] = [];

	let currentPart = '';
	let quotesType: "'" | '"' | null = null;

	for (let i = 0; i < input.length; i++) {
		const char = input[i];
		switch (char) {
			case ' ':
				if (quotesType !== null) {
					currentPart += char;
					break;
				}
				if (currentPart) {
					parts.push(currentPart);
					currentPart = '';
				}
				break;
			case '"':
			case "'":
				if (prevChar(input, i) === '\\') {
					currentPart += char;
					break;
				}
				if (quotesType === null) {
					quotesType = char;
					break;
				}
				if (quotesType === char) {
					quotesType = null;
					break;
				}
				currentPart += char;
				break;
			default:
				currentPart += char;
		}
	}

	if (currentPart) {
		parts.push(currentPart);
	}

	if (parts.length === 0) {
		return { command: '', args: [] };
	}

	const [command, ...args] = parts;
	return { command, args };
};

export { parseCommand };
