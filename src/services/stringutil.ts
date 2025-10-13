const prependEvery = (str: string, array: string[]) => {
	return array.map(s => `${str}${s}`);
};

export { prependEvery };
