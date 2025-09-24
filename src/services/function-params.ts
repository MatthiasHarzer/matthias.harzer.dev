/**
 * @param func
 * @returns An array of tuples containing the parameter name and a boolean indicating if the parameter has a default value
 * @source https://stackoverflow.com/a/9924463 (modified)
 */
// biome-ignore lint/suspicious/noExplicitAny: unknown function signature
const getFunctionParameters = (func: (...args: any[]) => any): [string, boolean][] => {
	const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
	const fnStr = func.toString().replace(STRIP_COMMENTS, '');
	const paramsStr = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).trim();

	if (paramsStr.length === 0) return [];

	const params = paramsStr.split(',').map(p => p.trim());

	return params.map(p => {
		const parts = p.split('=');
		const hasDefault = parts.length > 1 || parts[0].startsWith('...');
		return [parts[0].trim(), hasDefault];
	});
};

const paramsToString = (params: [string, boolean][]): string => {
	return params
		.reduce((acc, [param, hasDefault]) => {
			if (hasDefault) {
				return `${acc} [${param}]`;
			} else {
				return `${acc} <${param}>`;
			}
		}, '')
		.trim();
};

export { getFunctionParameters, paramsToString };
